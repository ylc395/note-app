import { uniqueId } from 'lodash-es';
import { observable, action, computed } from 'mobx';
import assert from 'assert';

import Editor from '#domain/client/app/model/abstract/Editor';
import { container } from '#domain/shared/infra/singletons';
import type { EntityLocator } from '#domain/client/shared/model/entity';

import Tile from '../Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import HistoryStack, { type Direction } from './HistoryStack';
import EditorFactory from '../EditorFactory';

export enum TileSplitDirections {
  Top,
  Bottom,
  Left,
  Right,
}

type Dest = Tile | Editor | { from?: Tile; splitDirection: TileSplitDirections };

export default class Workbench {
  public readonly historyStack = container.resolve(HistoryStack);
  private readonly editorFactory = container.resolve(EditorFactory);
  private readonly tilesMap: Record<Tile['id'], Tile> = {};
  @observable public accessor root: TileNode | undefined; // a binary tree

  @computed
  public get currentTile() {
    return this.historyStack.currentEditor?.tile;
  }

  private createTile() {
    const tile = new Tile();

    tile.on(Tile.events.Destroyed, () => this.removeTile(tile));
    tile.on(Tile.events.EditorSwitched, ({ to, fromHistory }) => this.historyStack.push(to, fromHistory));

    this.tilesMap[tile.id] = tile;
    return tile;
  }

  @action.bound
  private removeTile(tile: Tile) {
    delete this.tilesMap[tile.id];

    const searchAndRemove = (node: TileNode, parentNode?: TileParent): TileNode | null => {
      if (isTileLeaf(node)) {
        return null;
      }

      if (node.first !== tile.id && node.second !== tile.id) {
        return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
      }

      const nodeToKeep = node.first === tile.id ? node.second : node.first;

      if (parentNode) {
        const branchOfParent = parentNode.first === node ? 'first' : 'second';
        parentNode[branchOfParent] = nodeToKeep;
      } else {
        // if parentNode is undefined, node must be root
        this.root = nodeToKeep;
      }

      return nodeToKeep;
    };

    assert(this.root, 'no root');

    if (this.root === tile.id) {
      this.root = undefined;
      this.historyStack.push(null);
    } else {
      const keptTile = searchAndRemove(this.root);
      assert(keptTile, 'can not find tile');

      if (isTileLeaf(keptTile)) {
        const tile = this.tilesMap[keptTile];
        assert(tile?.currentEditor);

        this.historyStack.push(tile.currentEditor);
      }
    }
  }

  @action
  private splitTile(from: Tile['id'], direction: TileSplitDirections) {
    assert(this.root);

    const splitDirectionToDirection = (direction: TileSplitDirections) => {
      return direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Top
        ? TileDirections.Vertical
        : TileDirections.Horizontal;
    };

    const newTile = this.createTile();

    if (this.root === from) {
      this.root = {
        id: uniqueId('tileParent-'),
        direction: splitDirectionToDirection(direction),
        ...(direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Right
          ? { first: this.root, second: newTile.id }
          : { second: this.root, first: newTile.id }),
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
      const { from = this.currentTile, splitDirection } = dest;
      assert(from);
      targetTile = this.splitTile(from.id, splitDirection);
    }

    targetTile.moveEditor(src, dest instanceof Editor ? dest : undefined);
    targetTile.switchToEditor(src);
  }

  @action
  private initRootTile() {
    const rootTile = this.createTile();
    this.root = rootTile.id;

    return rootTile;
  }

  @action.bound
  public openEntity(entity: EntityLocator, options?: { dest?: Dest; replace?: boolean }) {
    const dest = options?.dest || this.currentTile || this.initRootTile();

    let targetTile: Tile | undefined;
    let editor: Editor;

    // 打开到指定 tile，或是指定 editor 旁边
    if (dest instanceof Tile || dest instanceof Editor) {
      targetTile = dest instanceof Tile ? dest : dest.tile;

      const existedEditor = targetTile.findEditor(entity);

      if (existedEditor) {
        editor = existedEditor;

        if (dest instanceof Editor) {
          targetTile.moveEditor(existedEditor, dest);
        }
      } else {
        editor = targetTile.createEditor(entity, {
          dest: dest instanceof Editor ? dest : undefined,
          replace: options?.replace,
        });
      }
    } else {
      const { from = this.currentTile, splitDirection } = dest;
      assert(from, 'can not split tile');

      targetTile = this.splitTile(from.id, splitDirection);
      editor = targetTile.createEditor(entity);
    }

    targetTile.switchToEditor(editor);
  }

  public historyGo(direction: Direction, step = 1) {
    const record = this.historyStack.pop(direction, step);
    const dest = this.editorFactory.getEditorById(record.editorId) || this.tilesMap[record.tileId];

    this.openEntity(record, { dest });
  }
}
