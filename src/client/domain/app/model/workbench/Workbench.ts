import { pull, uniqueId, last } from 'lodash-es';
import { observable, makeObservable, action, computed } from 'mobx';
import { singleton } from 'tsyringe';
import assert from 'assert';

import Editor from '@domain/app/model/abstract/Editor';
import { isEditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import Tile, { EventNames as TileEvents } from './Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import { EntityLocator, EntityTypes } from '../entity';

export enum TileSplitDirections {
  Top,
  Bottom,
  Left,
  Right,
}

const splitDirectionToDirection = (direction: TileSplitDirections) => {
  return direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Top
    ? TileDirections.Vertical
    : TileDirections.Horizontal;
};

type Dest = Tile | Editor | { from?: Tile; splitDirection: TileSplitDirections };

@singleton()
export default class Workbench {
  constructor() {
    makeObservable(this);
  }

  private readonly tilesMap: Record<Tile['id'], Tile> = {};
  @observable.shallow private readonly focusedTileHistory: Tile[] = [];
  @observable public root?: TileNode; // a binary tree

  @computed
  public get focusedTile() {
    return this.focusedTileHistory[this.focusedTileHistory.length - 1];
  }

  private readonly handleTileFocus = (tile: Tile) => {
    if (last(this.focusedTileHistory) !== tile) {
      this.focusedTileHistory.push(tile);
    }
  };

  private createTile() {
    const tile = new Tile();

    tile.on(TileEvents.Destroyed, () => this.removeTile(tile));
    tile.on(TileEvents.Focus, () => this.handleTileFocus(tile));
    this.tilesMap[tile.id] = tile;

    return tile;
  }

  @action.bound
  private removeTile(tile: Tile) {
    delete this.tilesMap[tile.id];

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

  @action
  private splitTile(from: Tile['id'], direction: TileSplitDirections) {
    assert(this.root);

    const newTile = this.createTile();

    if (this.root === from) {
      this.root = {
        id: uniqueId('tileParent-'),
        direction: splitDirectionToDirection(direction),
        ...(direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Right
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
          ...(direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Right
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

  @action
  private getFocusedTile() {
    if (this.focusedTile) {
      return this.focusedTile;
    }

    if (!this.root) {
      this.root = this.createTile().id;
    }

    assert(isTileLeaf(this.root), 'no focusedTile');
    const rootTile = this.tilesMap[this.root];
    assert(rootTile);

    return rootTile;
  }

  @action.bound
  public moveEditor(src: Editor, dest: Dest) {
    if (src === dest) {
      return;
    }

    let targetTile: Tile;

    if (dest instanceof Editor) {
      assert(dest.tile);
      targetTile = dest.tile;
    } else if (dest instanceof Tile) {
      targetTile = dest;
    } else {
      const { from = this.focusedTile, splitDirection } = dest;
      assert(from);
      targetTile = this.splitTile(from.id, splitDirection);
    }

    targetTile.addEditorTo(src, dest instanceof Editor ? dest : undefined);
    targetTile.switchToEditor(src);
  }

  public getTileById(id: Tile['id']) {
    const tile = this.tilesMap[id];
    assert(tile);

    return tile;
  }

  @action.bound
  public openEntity(entity: EntityLocator, dest?: Dest) {
    if (!isEditableEntityLocator(entity) || (entity.entityType === EntityTypes.Material && !entity.mimeType)) {
      return;
    }

    let targetTile: Tile | undefined;
    let editor: Editor;

    if (dest instanceof Tile || dest instanceof Editor || !dest) {
      targetTile = dest ? (dest instanceof Tile ? dest : dest.tile) : this.getFocusedTile();

      assert(targetTile);

      if (targetTile.switchToEditor(entity)) {
        if (dest instanceof Editor) {
          const editor = targetTile.findByEntity(entity);
          assert(editor);
          targetTile.addEditorTo(editor, dest);
        }
        return;
      }

      editor = targetTile.createEditor(entity, dest instanceof Editor ? dest : undefined);
    } else {
      const { from = this.focusedTile, splitDirection } = dest;
      assert(from);
      targetTile = this.splitTile(from.id, splitDirection);
      editor = targetTile.createEditor(entity);
    }

    targetTile.switchToEditor(editor);
  }
}
