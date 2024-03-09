import { container } from 'tsyringe';
import { groupBy, intersection, once } from 'lodash-es';
import { action, computed, runInAction, makeObservable, autorun } from 'mobx';

import type Tree from '@domain/common/model/abstract/Tree';
import { Workbench } from '@domain/app/model/workbench';
import type { EntityId, HierarchyEntity, UpdateEvent } from '@domain/app/model/entity';
import { token as localStorage } from '@domain/app/infra/localStorage';
import type RenameBehavior from './RenameBehavior';
import type ContextmenuBehavior from './ContextmenuBehavior';
import DndBehavior from './DndBehavior';

export { default as RenameBehavior } from './RenameBehavior';

interface ExplorerState {
  expanded: EntityId[];
}

export default abstract class Explorer<T extends HierarchyEntity = HierarchyEntity> {
  constructor() {
    makeObservable(this);
  }

  private readonly localStorage = container.resolve(localStorage);
  protected readonly workbench = container.resolve(Workbench);
  public abstract readonly rename: RenameBehavior;
  public abstract readonly contextmenu: ContextmenuBehavior;
  public abstract readonly tree: Tree<T>;
  public readonly dnd = new DndBehavior({ explorer: this });
  public get entityType() {
    return this.tree.entityType;
  }

  public readonly init = once(async () => {
    await this.tree.root.loadChildren();
    const state = this.localStorage.get<ExplorerState>(this.localStorageKey);

    if (state) {
      await this.expandNodes(state.expanded);
    }

    autorun(this.persist);
  });

  protected abstract queryFragments(id: T['id']): Promise<T[]>;

  public async reveal(id: T['id'], options?: { expand?: boolean; select?: boolean }) {
    if (id && !this.tree.getNode(id, true)) {
      const nodes = await this.queryFragments(id);
      this.tree.updateTree(nodes);
    }

    if (options?.expand && id && !this.tree.getNode(id).isLeaf) {
      this.tree.getNode(id).toggleExpand({ value: true });
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
  public get canCollapse() {
    return this.tree.expandedNodes.length > 0;
  }

  @action.bound
  public collapseAll() {
    for (const node of this.tree.expandedNodes) {
      node.toggleExpand({ value: false });
    }
  }

  public readonly handleEntityUpdate = (e: UpdateEvent) => {
    const entity = this.tree.getNode(e.id, true)?.entity;

    if (e.explorerUpdated || !entity) {
      // MoveBehavior will updateTree by itself
      return;
    }

    this.tree.updateTree({ ...entity, ...e });
  };

  private get localStorageKey() {
    return `explorer-${this.entityType}`;
  }

  private readonly persist = () => {
    this.localStorage.set<ExplorerState>(this.localStorageKey, {
      expanded: this.tree.expandedNodes.map((node) => node.id),
    });
  };

  private async expandNodes(ids: EntityId[]) {
    if (ids.length === 0) {
      return;
    }

    const allNodeIds = this.tree.allNodes.map((node) => node.id);
    const entities = await this.tree.queryChildren(ids);
    const childrenMap = groupBy(entities, 'parentId');
    const sorted = intersection(ids, allNodeIds).flatMap((id) => childrenMap[id] || []);
    let i = 0;

    while (sorted[i]) {
      sorted.push(...(childrenMap[sorted[i]!.id] || []));
      i++;
    }

    this.tree.updateTree(sorted);

    for (const id of ids) {
      this.tree.getNode(id, true)?.toggleExpand({ value: true, noLoad: true });
    }
  }
}
