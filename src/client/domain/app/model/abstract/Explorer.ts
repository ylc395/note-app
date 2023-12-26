import { container } from 'tsyringe';
import { action, computed } from 'mobx';
import { Emitter, type EventMap } from 'strict-event-emitter';

import Tree from '@domain/common/model/abstract/Tree';
import { token as uiToken } from '@domain/app/infra/ui';

export default abstract class Explorer<T extends EventMap = any> extends Emitter<T> {
  protected readonly ui = container.resolve(uiToken);
  public abstract readonly tree: Tree;
  public abstract loadRoot(): void;

  @action.bound
  public resetTree() {
    for (const node of this.tree.allNodes) {
      node.isDisabled = false;
    }
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
