import { container } from 'tsyringe';
import { action, computed, makeObservable, observable } from 'mobx';
import { Workbench } from '../workbench';

import Tree from '@domain/common/model/abstract/Tree';
import { token as uiToken } from '@domain/app/infra/ui';

export default abstract class Explorer {
  constructor() {
    makeObservable(this);
  }

  protected readonly ui = container.resolve(uiToken);
  public abstract readonly tree: Tree;
  public abstract load(): void;
  protected readonly workbench = container.resolve(Workbench);

  @observable
  public status: 'idle' | 'toDrop' = 'idle';

  @action.bound
  public reset() {
    for (const node of this.tree.allNodes) {
      node.isDisabled = false;
    }

    this.status = 'idle';
  }

  @computed
  public get selectedNodesAsTree() {
    const tree = new (this.tree.constructor as { new (): Tree })();

    tree.updateChildren(
      null,
      this.tree.selectedNodes.map(({ entity }) => ({ ...entity!, parentId: null })),
    );

    for (const node of tree.root.children) {
      node.isLeaf = true;
    }

    return tree;
  }
}
