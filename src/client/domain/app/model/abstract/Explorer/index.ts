import { container } from 'tsyringe';

import type Tree from '@domain/common/model/abstract/Tree';
import { Workbench } from '@domain/app/model/workbench';
import type { EntityTypes, HierarchyEntity, UpdateEvent } from '@domain/app/model/entity';
import type RenameBehavior from './RenameBehavior';
import type ContextmenuBehavior from './ContextmenuBehavior';
import DndBehavior from './DndBehavior';
import MoveBehavior from '../behaviors/MoveBehavior';

export { default as RenameBehavior } from './RenameBehavior';

export default abstract class Explorer<T extends HierarchyEntity = HierarchyEntity> {
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly entityType: EntityTypes;
  public abstract readonly rename: RenameBehavior;
  public abstract readonly contextmenu: ContextmenuBehavior;
  public abstract readonly tree: Tree<T>;
  public readonly dnd = new DndBehavior({ explorer: this });

  // todo: rewrite load
  public load() {
    this.tree.root.loadChildren();
  }

  public readonly handleEntityUpdate = (e: UpdateEvent) => {
    const entity = this.tree.getNode(e.id, true)?.entity;

    if (e.trigger instanceof MoveBehavior || !entity) {
      // MoveBehavior will updateTree by itself
      return;
    }

    this.tree.updateTree({ ...entity, ...e });
  };
}
