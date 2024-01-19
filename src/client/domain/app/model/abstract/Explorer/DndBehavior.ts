import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type Tree from '@domain/common/model/abstract/Tree';

import type Explorer from './index';

export default class DndBehavior {
  constructor(private readonly explorer: Explorer<never>) {
    makeObservable(this);
  }

  @observable
  public status: 'idle' | 'toDrop' = 'idle';

  @action.bound
  public reset() {
    for (const node of this.explorer.tree.allNodes) {
      node.isDisabled = false;
    }

    this.status = 'idle';
  }

  @action.bound
  public updateTreeForDropping(movingId?: TreeNode['id']) {
    const nodes = movingId ? [this.explorer.tree.getNode(movingId)] : this.explorer.tree.selectedNodes;

    for (const node of nodes) {
      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of node.descendants) {
        descendant.isDisabled = true;
      }
    }

    this.status = 'toDrop';
  }

  @computed
  public get selectedNodesAsTree() {
    const tree = new (this.explorer.tree.constructor as { new (): Tree })();
    tree.updateTree(this.explorer.tree.selectedNodes.map(({ entity }) => ({ ...entity!, parentId: null })));

    runInAction(() => {
      tree.root.isLeaf = true;
    });

    return tree;
  }
}
