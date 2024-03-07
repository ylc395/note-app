import { container } from 'tsyringe';
import { once } from 'lodash-es';
import { action, computed, runInAction, makeObservable } from 'mobx';

import type Tree from '@domain/common/model/abstract/Tree';
import { Workbench } from '@domain/app/model/workbench';
import type { EntityTypes, HierarchyEntity, UpdateEvent } from '@domain/app/model/entity';
import type RenameBehavior from './RenameBehavior';
import type ContextmenuBehavior from './ContextmenuBehavior';
import DndBehavior from './DndBehavior';
import MoveBehavior from '../../../service/behaviors/MoveBehavior';

export { default as RenameBehavior } from './RenameBehavior';

export default abstract class Explorer<T extends HierarchyEntity = HierarchyEntity> {
  constructor() {
    makeObservable(this);
  }
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly entityType: EntityTypes;
  public abstract readonly rename: RenameBehavior;
  public abstract readonly contextmenu: ContextmenuBehavior;
  public abstract readonly tree: Tree<T>;
  public readonly dnd = new DndBehavior({ explorer: this });

  public readonly init = once(() => {
    this.tree.root.loadChildren();
  });

  protected abstract queryFragments(id: T['id']): Promise<T[]>;

  public async reveal(id: T['id'], options?: { expand?: boolean; select?: boolean }) {
    if (id && !this.tree.getNode(id, true)) {
      const nodes = await this.queryFragments(id);
      this.tree.updateTree(nodes);
    }

    if (options?.expand && id && !this.tree.getNode(id).isLeaf) {
      this.tree.getNode(id).toggleExpand(true);
    }

    if (options?.select && id) {
      this.tree.setSelected([id]);
    }

    let node = this.tree.getNode(id).parent;

    runInAction(() => {
      while (node && node !== this.tree.root) {
        node.isExpanded = true;
        node = node.parent;
      }
    });
  }

  @computed
  private get expandedNodes() {
    return Object.values(this.tree.allNodes).filter((node) => node.isExpanded);
  }

  @computed
  public get hasExpandedNode() {
    return this.expandedNodes.length > 0;
  }

  @action.bound
  public collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
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
