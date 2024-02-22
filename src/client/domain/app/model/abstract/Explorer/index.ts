import { container } from 'tsyringe';

import type Tree from '@domain/common/model/abstract/Tree';
import { Workbench } from '@domain/app/model/workbench';
import type { EntityTypes, HierarchyEntity, UpdateEvent } from '@domain/app/model/entity';
import type RenameBehavior from './RenameBehavior';
import type ContextmenuBehavior from './ContextmenuBehavior';
import DndBehavior from './DndBehavior';
import MoveBehavior from '../behaviors/MoveBehavior';

export { default as RenameBehavior } from './RenameBehavior';

export default abstract class Explorer<T extends HierarchyEntity> {
  public abstract readonly rename: RenameBehavior;
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly entityType: EntityTypes;
  public abstract readonly contextmenu: ContextmenuBehavior<T>;
  public abstract readonly tree: Tree<T>;
  public readonly dnd = new DndBehavior({ explorer: this });

  public load() {
    this.tree.root.loadChildren();
  }

  protected readonly handleEntityUpdate = (e: UpdateEvent) => {
    if (e.trigger instanceof MoveBehavior) {
      // MoveBehavior will updateTree by itself
      return;
    }

    this.tree.updateTree(e as unknown as Partial<T>);
  };
}
