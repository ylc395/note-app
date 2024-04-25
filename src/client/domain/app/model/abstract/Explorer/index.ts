import { container } from 'tsyringe';
import { groupBy, intersection, once } from 'lodash-es';
import { action, computed, makeObservable, autorun } from 'mobx';

import type Tree from '@domain/common/model/abstract/Tree';
import type { EntityId, HierarchyEntity, Path, UpdateEvent } from '@domain/app/model/entity';
import { token as localStorage } from '@domain/app/infra/localStorage';
import { token as rpcToken } from '@domain/common/infra/rpc';
import type RenameBehavior from './RenameBehavior';
import SortBehavior from './SortBehavior';
import MoveBehavior from '../../behavior/MoveBehavior';

interface ExplorerState {
  scroll?: { x: number; y: number };
  expanded?: EntityId[];
  selected?: EntityId[];
}

export default abstract class Explorer<T extends HierarchyEntity = HierarchyEntity> {
  constructor() {
    makeObservable(this);
  }

  private readonly localStorage = container.resolve(localStorage);
  protected readonly remote = container.resolve(rpcToken);
  public abstract readonly rename: RenameBehavior;
  public readonly sorter = new SortBehavior();
  public abstract readonly tree: Tree<T>;
  public get entityType() {
    return this.tree.entityType;
  }

  private get uiState() {
    return this.localStorage.get<ExplorerState>(this.localStorageKey);
  }

  public get scrollInfo() {
    return this.uiState?.scroll;
  }

  public readonly init = once(async () => {
    await this.tree.root.loadChildren();

    const { uiState } = this;

    if (uiState?.expanded) {
      await this.expandNodes(uiState.expanded);
    }

    if (uiState?.selected) {
      this.tree.setSelected(uiState.selected);
    }

    autorun(this.persistUIState);
  });

  protected abstract queryPath(id: EntityId): Promise<Path>;

  public async reveal(id: T['id'], options?: { expand?: boolean; select?: boolean }) {
    const nodeToReveal = this.tree.getNode(id, true);
    let ids: EntityId[];

    if (nodeToReveal) {
      ids = nodeToReveal.ancestors.map(({ id }) => id);
    } else {
      const ancestors = await this.queryPath(id);
      ids = ancestors.map(({ id }) => id);
    }

    if (options?.expand) {
      ids.push(id);
    }

    await this.expandNodes(ids);

    if (options?.select) {
      this.tree.setSelected([id]);
    }
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

  private get localStorageKey() {
    return `explorer-${this.entityType}-ui`;
  }

  private readonly persistUIState = () => {
    this.localStorage.set<ExplorerState>(this.localStorageKey, {
      selected: this.tree.getSelectedNodeIds(),
      expanded: this.tree.expandedNodes
        .filter((node) => node.ancestors.every((ancestor) => ancestor.isExpanded))
        .map((node) => node.id),
    });
  };

  public readonly persistScrollInfo = (scrollInfo: NonNullable<ExplorerState['scroll']>) => {
    this.localStorage.set<ExplorerState>(this.localStorageKey, { scroll: scrollInfo });
  };

  private readonly expandingNodes = new Set<EntityId>();
  private async expandNodes(ids: EntityId[]) {
    ids = ids.filter((id) => !this.tree.getNode(id, true)?.isLoaded && !this.expandingNodes.has(id));
    ids.forEach((id) => this.expandingNodes.add(id));

    if (ids.length > 0) {
      const allNodeIds = this.tree.allNodes.map((node) => node.id);
      const childrenMap = groupBy(await this.tree.queryChildren(ids), 'parentId');
      const topoSorted = intersection(ids, allNodeIds).flatMap((id) => childrenMap[id] || []);
      let i = 0;

      while (topoSorted[i]) {
        topoSorted.push(...(childrenMap[topoSorted[i]!.id] || []));
        i++;
      }

      this.tree.updateTreeByEntity(topoSorted);
    }

    for (const id of ids) {
      const node = this.tree.getNode(id, true);

      if (node) {
        node.toggleExpand({ value: true, noLoad: true });
        node.isLoaded = true;
      }

      this.expandingNodes.delete(id);
    }
  }

  public getTreeFromSelectedNodes() {
    if (this.tree.selectedNodes.length === 0) {
      return null;
    }

    const tree = this.tree.clone();
    tree.updateTreeByEntity(this.tree.selectedNodes.map(({ entity }) => ({ ...entity!, parentId: null })));

    return tree;
  }

  protected readonly handleEntityUpdate = async ({ trigger, entity }: UpdateEvent<T>) => {
    this.tree.updateTree(entity);

    if (trigger instanceof MoveBehavior) {
      await this.reveal(entity.id);
      this.tree.getNode(entity.id).toggleSelect({ isMultiple: true, value: true });
    }
  };
}
