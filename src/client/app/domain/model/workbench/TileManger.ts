import remove from 'lodash/remove';
import uniqueId from 'lodash/uniqueId';
import { observable, makeObservable, action, computed } from 'mobx';

import Tile, { Events as TileEvents } from './Tile';

export type TileNode = TileParent | Tile['id'];

export enum TileDirections {
  Horizontal,
  Vertical,
}

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

export interface TileParent {
  id: string;
  direction: TileDirections;
  first: TileNode;
  second: TileNode;
  splitPercentage?: number; // first tile's width
}

export const isTileLeaf = (v: unknown): v is Tile['id'] => typeof v === 'string';

export const MAX_TILE_WIDTH = 100;
export const MIN_TILE_WIDTH = 20;

export default class TileManager {
  private readonly tilesMap = new Map<Tile['id'], Tile>();
  @observable.shallow private readonly focusedTileHistory: Tile[] = [];
  @observable root?: TileNode; // a binary tree

  @computed
  get focusedTile() {
    return this.focusedTileHistory[this.focusedTileHistory.length - 1];
  }

  constructor() {
    makeObservable(this);
  }

  @action.bound
  setFocusedTile(id: Tile['id'] | Tile) {
    const tile = typeof id === 'string' ? this.getTile(id) : id;
    this.focusedTileHistory.push(tile);
  }

  private createTile(focus?: true) {
    const tile = new Tile();

    tile.on(TileEvents.destroyed, () => this.removeTile(tile.id));
    this.tilesMap.set(tile.id, tile);

    if (focus) {
      this.setFocusedTile(tile);
    }

    return tile;
  }

  @action.bound
  private removeTile(tileId: Tile['id']) {
    this.tilesMap.delete(tileId);

    if (!this.root) {
      throw new Error('no tile');
    }

    if (this.root === tileId) {
      this.root = undefined;
      return;
    }

    const searchAndRemove = (node: TileNode, parentNode?: TileParent): boolean => {
      if (typeof node === 'string') {
        return false;
      }

      if (node.first !== tileId && node.second !== tileId) {
        return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
      }

      const branchToKeep = node.first === tileId ? 'second' : 'first';

      if (parentNode) {
        const branchOfParent = parentNode.first === node ? 'first' : 'second';
        parentNode[branchOfParent] = node[branchToKeep];
      } else {
        // if parentNode is undefined, node must be root
        this.root = node[branchToKeep];
      }

      return true;
    };

    if (!searchAndRemove(this.root)) {
      throw new Error('can not find tile');
    }

    remove(this.focusedTileHistory, ({ id }) => id === tileId);
  }

  @action.bound
  splitTile(from: Tile['id'], direction: TileSplitDirections) {
    if (!this.root) {
      throw new Error('no root');
    }

    const newTile = this.createTile(true);

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

  getTile(id: Tile['id']) {
    const tile = this.tilesMap.get(id);

    if (!tile) {
      throw new Error(`wrong id ${id}`);
    }

    return tile;
  }

  getTileAsTarget() {
    if (!this.root) {
      this.root = this.createTile(true).id;
    }

    if (!this.focusedTile) {
      throw new Error('no focusedWindow');
    }

    return this.focusedTile;
  }
}
