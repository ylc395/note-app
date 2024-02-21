import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import TreeNode from '@domain/common/model/abstract/TreeNode';
import type Tree from '@domain/common/model/abstract/Tree';

import type Explorer from './index';
import type { EntityLocator, HierarchyEntity } from '@shared/domain/model/entity';

export default class DndBehavior<T extends HierarchyEntity> {
  constructor(private readonly options: { explorer: Explorer<T> }) {
    makeObservable(this);
  }

  @observable
  public status: 'idle' | 'toDrop' = 'idle';

  @action.bound
  public reset() {
    for (const node of this.options.explorer.tree.allNodes) {
      node.isDisabled = false;
    }

    this.status = 'idle';
  }

  @action.bound
  public updateTreeForDropping(entity?: EntityLocator) {
    let nodes: TreeNode[] = [];
    let isAll = false;

    if (!entity) {
      nodes = this.options.explorer.tree.selectedNodes;
    } else if (entity.entityType !== this.options.explorer.entityType) {
      nodes = this.options.explorer.tree.allNodes;
      isAll = true;
    } else {
      nodes = [this.options.explorer.tree.getNode(entity.entityId)];
    }

    for (const node of nodes) {
      node.isDisabled = true;

      if (isAll) {
        continue;
      }

      node.parent!.isDisabled = true;
      for (const descendant of node.descendants) {
        descendant.isDisabled = true;
      }
    }

    this.status = 'toDrop';
  }

  @computed
  public get selectedNodesAsTree() {
    const tree = new (this.options.explorer.tree.constructor as { new (): Tree })();
    tree.updateTree(this.options.explorer.tree.selectedNodes.map(({ entity }) => ({ ...entity!, parentId: null })));

    runInAction(() => {
      tree.root.isLeaf = true;
    });

    return tree;
  }
}
