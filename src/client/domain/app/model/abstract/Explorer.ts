import { container } from 'tsyringe';
import { pickBy } from 'lodash-es';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import assert from 'assert';

import Tree from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity, WithId } from '../entity';
import EventBus from '@domain/app/infra/EventBus';
import { MenuItem, token as uiToken } from '@shared/domain/infra/ui';
import { Workbench } from '../workbench';

export enum EventNames {
  Action = 'action',
}

export interface ActionEvent {
  action: string;
  id: TreeNode<never>['id'][];
}

export default abstract class Explorer<T extends HierarchyEntity> extends EventBus<{
  [EventNames.Action]: ActionEvent;
}> {
  constructor(name: string) {
    super(name);
    makeObservable(this);
  }

  protected readonly ui = container.resolve(uiToken);
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly tree: Tree;

  @observable
  public status: 'idle' | 'toDrop' = 'idle';

  @action.bound
  public reset() {
    for (const node of this.tree.allNodes) {
      node.isDisabled = false;
    }

    this.status = 'idle';
  }

  public load() {
    this.tree.root.loadChildren();
  }

  protected readonly updateNode = ({ id, ...patch }: WithId<T>) => {
    const node = this.tree.getNode(id, true);

    if (node) {
      assert(node.entity);
      this.tree.updateTree({
        ...node.entity,
        ...pickBy(patch, (_, key) => key in node.entity!),
      });
    }
  };

  @action.bound
  public updateTreeForDropping(movingId?: TreeNode<T>['id']) {
    const nodes = movingId ? [this.tree.getNode(movingId)] : this.tree.selectedNodes;

    for (const node of nodes) {
      node.isDisabled = true;
      node.parent!.isDisabled = true;

      for (const descendant of node.descendants) {
        descendant.isDisabled = true;
      }
    }

    this.status = 'toDrop';
  }

  protected abstract getContextmenu(): Promise<MenuItem[]>;

  public readonly showContextmenu = async () => {
    const action = await this.ui.getActionFromMenu(await this.getContextmenu());

    if (action) {
      this.emit(EventNames.Action, { action, id: this.tree.getSelectedNodeIds() });
    }
  };

  @computed
  public get selectedNodesAsTree() {
    const tree = new (this.tree.constructor as { new (): Tree })();
    tree.updateTree(this.tree.selectedNodes.map(({ entity }) => ({ ...entity!, parentId: null })));

    runInAction(() => {
      tree.root.isLeaf = true;
    });

    return tree;
  }
}
