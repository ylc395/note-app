import { container } from 'tsyringe';
import { pickBy } from 'lodash-es';
import assert from 'assert';

import Tree from '@domain/common/model/abstract/Tree';
import type { EntityTypes, HierarchyEntity, WithId } from '../../entity';
import EventBus from '@domain/app/infra/EventBus';
import { MenuItem, token as uiToken } from '@shared/domain/infra/ui';
import { TileSplitDirections, Workbench } from '../../workbench';
import type RenameBehavior from './RenameBehavior';
import type TreeNode from '@domain/common/model/abstract/TreeNode';
import DndBehavior from './DndBehavior';

export { default as RenameBehavior } from './RenameBehavior';

export enum EventNames {
  Action = 'action',
}

export interface ActionEvent {
  action: string;
  id: TreeNode['id'];
}

export default abstract class Explorer<T extends HierarchyEntity> extends EventBus<{
  [EventNames.Action]: ActionEvent;
}> {
  constructor(name: string) {
    super(name);
  }

  protected readonly ui = container.resolve(uiToken);
  protected readonly workbench = container.resolve(Workbench);
  protected abstract readonly rename: RenameBehavior<T>;
  public readonly dnd = new DndBehavior(this);
  public abstract readonly entityType: EntityTypes;
  public abstract readonly tree: Tree;
  protected abstract getContextmenu(): MenuItem[];

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

  public readonly useContextmenu = async (node: TreeNode) => {
    const action = await this.ui.getActionFromMenu(this.getContextmenu());

    if (!action) {
      return;
    }

    const entity = this.tree.getNode(node.id).entityLocator;

    switch (action) {
      case 'rename':
        return this.rename.start(node.id);
      case 'openInNewTab':
        return this.workbench.openEntity(entity, { forceNewTab: true });
      case 'openToTop':
      case 'openToBottom':
      case 'openToRight':
      case 'openToLeft':
        return this.workbench.openEntity(
          entity,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { dest: { splitDirection: TileSplitDirections[action.match(/openTo(.+)/)![1] as any] as any } },
        );
      default:
        this.emit(EventNames.Action, { action, id: node.id });
    }
  };
}
