import { uniqueId } from 'lodash-es';
import { observable, makeObservable, action, computed } from 'mobx';
import { singleton } from 'tsyringe';
import assert from 'assert';

import Editor from '@domain/app/model/abstract/Editor';
import { isEditableEntityLocator } from '@domain/app/model/abstract/EditableEntity';
import Tile, { EventNames as TileEvents } from './Tile';
import { type TileNode, type TileParent, TileDirections, isTileLeaf } from './tileTree';
import { type EntityLocator, EntityTypes } from '../entity';
import HistoryManager from './HistoryManager';

export enum TileSplitDirections {
  Top,
  Bottom,
  Left,
  Right,
}

type Dest = Tile | Editor | { from?: Tile; splitDirection: TileSplitDirections };

@singleton()
export default class Workbench {
  constructor() {
    makeObservable(this);
  }

  public readonly historyManager = new HistoryManager(this);
  private readonly tilesMap: Record<Tile['id'], Tile> = {};
  @observable public root?: TileNode; // a binary tree

  @computed
  public get currentTile() {
    return this.historyManager.currentEditor?.tile;
  }

  private createTile() {
    const tile = new Tile();

    tile.on(TileEvents.Destroyed, () => this.removeTile(tile));
    tile.on(TileEvents.Switched, this.historyManager.update);
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
  }

  @action
  private splitTile(from: Tile['id'], direction: TileSplitDirections) {
    assert(this.root);

    const newTile = this.createTile();

    if (this.root === from) {
      this.root = {
        id: uniqueId('tileParent-'),
        direction: Workbench.splitDirectionToDirection(direction),
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
          direction: Workbench.splitDirectionToDirection(direction),
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
  private getOrCreateFocusedTile() {
    if (this.currentTile) {
      return this.currentTile;
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
      const { from = this.currentTile, splitDirection } = dest;
      assert(from);
      targetTile = this.splitTile(from.id, splitDirection);
    }

    targetTile.addEditorTo(src, dest instanceof Editor ? dest : undefined);
    targetTile.switchToEditor(src);
  }

  public getTileById(id: Tile['id']) {
    return this.tilesMap[id];
  }

  @action.bound
  public openEntity(
    entity: EntityLocator,
    options?: { dest?: Dest; forceNewTab?: true; reason?: Editor['visibilityReason'] },
  ) {
    if (!isEditableEntityLocator(entity) || (entity.entityType === EntityTypes.Material && !entity.mimeType)) {
      return;
    }

    const dest = options?.dest || this.getOrCreateFocusedTile();

    let targetTile: Tile | undefined;
    let editor: Editor;

    if (dest instanceof Tile || dest instanceof Editor) {
      targetTile = dest instanceof Tile ? dest : dest.tile;
      assert(targetTile);

      if (targetTile.switchToEditor(entity, options?.reason)) {
        // move existing editor to target editor
        if (dest instanceof Editor) {
          const editor = targetTile.findByEntity(entity);
          assert(editor);
          targetTile.addEditorTo(editor, dest);
        }
        return;
      } else {
        if (options?.forceNewTab) {
          editor = targetTile.createEditor(entity, { dest: 'tile', isActive: true });
        } else {
          const targetEditor = dest instanceof Editor ? dest : undefined;
          editor = targetTile.replaceOrCreateEditor(entity, { dest: targetEditor });
        }
      }
    } else {
      const { from = this.currentTile, splitDirection } = dest;
      assert(from);
      targetTile = this.splitTile(from.id, splitDirection);
      editor = targetTile.createEditor(entity, { isActive: options?.forceNewTab, dest: 'tile' });
    }

    targetTile.switchToEditor(editor, options?.reason);
  }

  private static splitDirectionToDirection(direction: TileSplitDirections) {
    return direction === TileSplitDirections.Bottom || direction === TileSplitDirections.Top
      ? TileDirections.Vertical
      : TileDirections.Horizontal;
  }
}
