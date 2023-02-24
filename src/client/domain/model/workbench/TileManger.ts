import { observable, makeObservable, action } from 'mobx';

import Tile, { Events as TileEvents } from './Tile';

export type TileNode = TileParent | Tile['id'];
export enum TileDirections {
  Horizontal,
  Vertical,
}

export interface TileParent {
  direction: TileDirections;
  first: TileNode;
  second: TileNode;
  splitPercentage?: number;
}

export const isTileId = (v: unknown): v is Tile['id'] => typeof v === 'string';

export default class TileManager {
  private readonly tilesMap = new Map<Tile['id'], Tile>();
  @observable root?: TileNode; // a binary tree
  @observable.ref focusedTile?: Tile;

  constructor() {
    makeObservable(this);
  }

  private createTile(focus?: true) {
    const tile = new Tile(this);

    tile.on(TileEvents.destroyed, () => this.removeTile(tile.id));
    this.tilesMap.set(tile.id, tile);

    if (focus) {
      this.focusedTile = tile;
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
      this.focusedTile = this.get(node[branchToKeep] as string);

      return true;
    };

    if (!searchAndRemove(this.root)) {
      throw new Error('can not find tile');
    }
  }

  @action.bound
  splitTile(from: Tile['id'], direction: TileDirections) {
    if (!this.root) {
      throw new Error('no root');
    }

    const newTile = this.createTile(true);

    if (this.root === from) {
      this.root = {
        direction,
        first: this.root,
        second: newTile.id,
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
          direction,
          first: parentNode[parentBranch],
          second: newTile.id,
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

  get(id: Tile['id']) {
    const tile = this.tilesMap.get(id);

    if (!tile) {
      throw new Error('wrong id');
    }

    return tile;
  }

  getTargetTile() {
    if (!this.root) {
      this.root = this.createTile(true).id;
    }

    if (!this.focusedTile) {
      throw new Error('no focusedWindow');
    }

    return this.focusedTile;
  }
}
