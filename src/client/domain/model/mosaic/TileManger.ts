import { observable, makeObservable, action } from 'mobx';
import { type MosaicNode, type MosaicParent, getOtherBranch } from 'react-mosaic-component';

import Tile, { Events as TileEvents } from './Tile';

export type TileId = Tile['id'];

export default class TileManager {
  private readonly tilesMap = new Map<TileId, Tile>();
  @observable root?: MosaicNode<TileId>; // a binary tree
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
  private removeTile(tileId: TileId) {
    this.tilesMap.delete(tileId);

    if (!this.root) {
      throw new Error('no tile');
    }

    if (this.root === tileId) {
      this.root = undefined;
      return;
    }

    const searchAndRemove = (node: MosaicNode<TileId>, parentNode?: MosaicParent<TileId>): boolean => {
      if (typeof node === 'string') {
        return false;
      }

      if (node.first !== tileId && node.second !== tileId) {
        return searchAndRemove(node.first, node) || searchAndRemove(node.second, node);
      }

      const branchToKeep = node.first === tileId ? 'second' : 'first';
      const branchToRemove = getOtherBranch(branchToKeep);

      if (parentNode) {
        parentNode[branchToRemove] = node[branchToKeep];
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
  splitTile(from: TileId) {
    if (!this.root) {
      throw new Error('no root');
    }

    const newWindow = this.createTile(true);

    if (this.root === from) {
      this.root = {
        direction: 'row',
        first: this.root,
        second: newWindow.id,
      };
      return newWindow;
    }

    const split = (node: MosaicNode<TileId>, parentNode?: MosaicParent<TileId>): boolean => {
      if (node === from) {
        if (!parentNode) {
          throw new Error('no parent');
        }

        const parentBranch = parentNode.first === node ? 'first' : 'second';
        parentNode[parentBranch] = {
          direction: 'row',
          first: parentNode[parentBranch],
          second: newWindow.id,
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

    return newWindow;
  }

  get(id: TileId, silent: true): Tile | undefined;
  get(id: TileId): Tile;
  get(id: TileId, silent?: true) {
    const tile = this.tilesMap.get(id);

    if (!tile && !silent) {
      throw new Error('wrong id');
    }

    return tile;
  }

  @action.bound
  update(root: MosaicNode<TileId> | null) {
    this.root = root || undefined;
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
