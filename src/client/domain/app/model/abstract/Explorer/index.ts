import { container } from 'tsyringe';
import { pickBy } from 'lodash-es';
import assert from 'assert';

import Tree from '@domain/common/model/abstract/Tree';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import type { HierarchyEntity, WithId } from '../../entity';
import EventBus from '@domain/app/infra/EventBus';
import { MenuItem, token as uiToken } from '@shared/domain/infra/ui';
import { Workbench } from '../../workbench';
import DndBehavior from './DndBehavior';

export { default as RenameBehavior } from './RenameBehavior';

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
  }

  protected readonly ui = container.resolve(uiToken);
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly tree: Tree;

  public load() {
    this.tree.root.loadChildren();
  }

  public readonly dnd = new DndBehavior(this);

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

  protected abstract getContextmenu(): Promise<MenuItem[]>;

  public readonly showContextmenu = async () => {
    const action = await this.ui.getActionFromMenu(await this.getContextmenu());

    if (action) {
      this.emit(EventNames.Action, { action, id: this.tree.getSelectedNodeIds() });
    }
  };
}
