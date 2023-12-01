import pull from 'lodash/pull';
import uniqueId from 'lodash/uniqueId';
import last from 'lodash/last';
import isMatch from 'lodash/isMatch';
import { observable, makeObservable, action, computed } from 'mobx';
import { container, singleton } from 'tsyringe';
import assert from 'assert';

import Editor from 'model/abstract/Editor';
import type { EditableEntityLocator } from 'model/entity';
import Tile, { EventNames as TileEvents } from './Tile';
import EditorManager, { EventNames as EditorManagerEvents } from './EditorManager';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';

export enum TileSplitDirections {
  Up,
  Down,
  Left,
  Right,
}

const splitDirectionToDirection = (direction: TileSplitDirections) => {
  return direction === TileSplitDirections.Down || direction === TileSplitDirections.Up
    ? TileDirections.Vertical
    : TileDirections.Horizontal;
};

type Dest = Tile | Editor | { from: Tile; splitDirection: TileSplitDirections };

@singleton()
export default class Workbench {
  private readonly tilesMap = new Map<Tile['id'], Tile>();
  readonly editorManager = container.resolve(EditorManager);
  @observable.shallow private readonly focusedTileHistory: Tile[] = [];
  @observable root?: TileNode; // a binary tree

  @computed
  get focusedTile() {
    return this.focusedTileHistory[this.focusedTileHistory.length - 1];
  }

  constructor() {
    makeObservable(this);
    this.editorManager.on(EditorManagerEvents.EditorFocus, this.handleEditorFocus);
  }

  private readonly handleEditorFocus = ({ tile }: Editor) => {
    assert(tile);

    if (last(this.focusedTileHistory) !== tile) {
      this.focusedTileHistory.push(tile);
    }
  };

  private createTile() {
    const tile = new Tile();

    tile.on(TileEvents.Destroyed, () => this.removeTile(tile));
    this.tilesMap.set(tile.id, tile);

    return tile;
  }

  @action.bound
  private removeTile(tile: Tile) {
    this.tilesMap.delete(tile.id);

    if (this.root === tile.id) {
      this.root = undefined;
    } else {
      const searchAndRemove = (node: TileNode, parentNode?: TileParent): boolean => {
        if (typeof node === 'string') {
          return false;
        }

        if (node.first !== tile.id && node.second !== tile.id) {
          return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
        }

        const branchToKeep = node.first === tile.id ? 'second' : 'first';

        if (parentNode) {
          const branchOfParent = parentNode.first === node ? 'first' : 'second';
          parentNode[branchOfParent] = node[branchToKeep];
        } else {
          // if parentNode is undefined, node must be root
          this.root = node[branchToKeep];
        }

        return true;
      };

      assert(this.root, 'no root');

      if (!searchAndRemove(this.root)) {
        assert.fail('can not find tile');
      }
    }

    pull(this.focusedTileHistory, tile);
  }

  @action.bound
  private splitTile(from: Tile['id'], direction: TileSplitDirections) {
    assert(this.root);

    const newTile = this.createTile();

    if (this.root === from) {
      this.root = {
        id: uniqueId('tileParent-'),
        direction: splitDirectionToDirection(direction),
        ...(direction === TileSplitDirections.Down || direction === TileSplitDirections.Right
          ? {
              first: this.root,
              second: newTile.id,
            }
          : {
              second: this.root,
              first: newTile.id,
            }),
      };
      return newTile;
    }

    const split = (node: TileNode, parentNode?: TileParent): boolean => {
      if (node === from) {
        if (!parentNode) {
          throw new Error('no parent');
        }

        const parentBranch = parentNode.first === node ? 'first' : 'second';
        parentNode[parentBranch] = {
          id: uniqueId('tileParent-'),
          direction: splitDirectionToDirection(direction),
          ...(direction === TileSplitDirections.Down || direction === TileSplitDirections.Right
            ? {
                first: parentNode[parentBranch],
                second: newTile.id,
              }
            : {
                second: parentNode[parentBranch],
                first: newTile.id,
              }),
        };

        return true;
      } else if (typeof node !== 'string') {
        return split(node.first, node) || split(node.second, node);
      }

      return false;
    };

    if (!split(this.root)) {
      throw new Error('can not find tile');
    }

    return newTile;
  }

  getTileById(id: Tile['id']) {
    const tile = this.tilesMap.get(id);
    assert(tile, `wrong id ${id}`);

    return tile;
  }

  @action
  private getFocusedTile() {
    if (this.focusedTile) {
      return this.focusedTile;
    }

    if (!this.root) {
      this.root = this.createTile().id;
    }

    assert(isTileLeaf(this.root), 'no focusedTile');
    return this.getTileById(this.root);
  }

  @action.bound
  moveEditor(src: Editor, dest: Dest) {
    if (src === dest) {
      return;
    }

    if (src.tile) {
      src.tile.removeEditor(src);
    }

    if (dest instanceof Editor) {
      assert(dest.tile);
      const destIndex = dest.tile.editors.findIndex((editor) => editor === dest);
      dest.tile.addEditor(src, destIndex);
    } else if (dest instanceof Tile) {
      dest.addEditor(src);
    } else {
      const { from, splitDirection } = dest;
      const newTile = this.splitTile(from.id, splitDirection);
      newTile.addEditor(src);
    }
  }

  openEntity(entity: EditableEntityLocator, dest?: Dest) {
    let targetTile: Tile | undefined;
    let editor: Editor;

    if (dest instanceof Tile || dest instanceof Editor || !dest) {
      targetTile = dest ? (dest instanceof Tile ? dest : dest.tile) : this.getFocusedTile();

      assert(targetTile);

      if (targetTile.switchToEditor((editor) => isMatch(entity, editor.toEntityLocator()), true)) {
        return;
      }

      editor = targetTile.createEditor(entity, dest instanceof Editor ? dest : undefined);
    } else {
      targetTile = this.splitTile(dest.from.id, dest.splitDirection);
      editor = targetTile.createEditor(entity);
    }

    targetTile.switchToEditor(editor);
  }
}
