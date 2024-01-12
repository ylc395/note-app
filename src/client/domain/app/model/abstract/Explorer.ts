import { container } from 'tsyringe';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { Workbench } from '../workbench';

import Tree from '@domain/common/model/abstract/Tree';
import EventBus, { type Events } from '@domain/app/infra/EventBus';
import { token as uiToken } from '@shared/domain/infra/ui';

export default abstract class Explorer<T extends Events = Events> extends EventBus<T> {
  constructor(name: string) {
    super(name);
    makeObservable(this);
  }

  protected readonly ui = container.resolve(uiToken);
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly tree: Tree;
  public abstract load(): void;

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

    runInAction(() => {
      for (const node of tree.root.children) {
        node.isLeaf = true;
      }
    });

    return tree;
  }
}
