import { debounce, once } from 'lodash-es';
import { action, computed, autorun } from 'mobx';

import type Tree from '#domain/client/shared/model/abstract/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { UpdatedEvent } from '#domain/client/app/model/entity/events';
import type { EntityId, EntityTypes, HierarchyEntity } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import type TreeNode from '#domain/client/shared/model/abstract/TreeNode';
import type EventBus from '#domain/client/app/infra/EventBus';

import RenameBehavior from './RenameBehavior';
import SortBehavior from './SortBehavior';
import { type Events, EventNames } from './events';
import type { ExplorerUIState, create as createUIState } from './uiState';
import MoveBehavior from '../../entity/MoveBehavior';

export { create as createUIState } from './uiState';

export type { Events } from './events';

export { SortBy } from './SortBehavior';

export default abstract class Explorer<T extends HierarchyEntity> {
  protected readonly remote = container.resolve(rpcToken);

  private readonly move = container.resolve(MoveBehavior);

  public abstract readonly events: EventBus<Events>;

  public abstract readonly rename: RenameBehavior;

  public readonly sorter = new SortBehavior();

  public abstract readonly entityType: EntityTypes;

  public abstract readonly tree: Tree<T>;

  public abstract readonly uiState: ReturnType<typeof createUIState>;

  public readonly init = once(async () => {
    await this.tree.root.load();

    if (this.uiState.value?.expanded) {
      await this.tree.expand(this.uiState.value.expanded);
    }

    if (this.uiState.value?.selected) {
      this.tree.setSelected(this.uiState.value.selected);
    }

    autorun(this.updateUIState.bind(this));
  });

  @computed
  public get canCollapse() {
    return this.tree.expandedNodes.length > 0;
  }

  @action.bound
  public collapseAll() {
    for (const node of this.tree.expandedNodes) {
      node.toggleExpand(false);
    }
  }

  private updateUIState() {
    this.uiState.update({
      selected: this.tree.selectedNodes.map(({ id }) => id),
      expanded: this.tree.expandedNodes
        .filter((node) => node.ancestors.every(({ isExpanded }) => isExpanded))
        .map(({ id }) => id),
    });
  }

  protected handleEntityUpdated({ id, payload }: UpdatedEvent<Partial<T>>) {
    this.tree.update({ id, ...payload });
  }

  public readonly updateScrollInfo = debounce((scrollInfo: NonNullable<ExplorerUIState['scroll']>) => {
    this.uiState.update({ scroll: scrollInfo });
  }, 500);

  public async reveal(id: EntityId) {
    await this.tree.reveal(id, { select: true });
    this.events.emit(EventNames.Revealed, id);
  }

  protected isNodeDisabled(entity: T | null) {
    const node = this.tree.getNode(entity?.id ?? null);
    let ancestors: TreeNode<T>[] | undefined;

    for (const { entityId, entityType } of this.move.movingItems || []) {
      if (entityType !== this.entityType) {
        return true;
      }

      ancestors ||= [node, ...node.ancestors];

      // 移动中的任意 item 不能是当前节点的祖先（包括自身）
      if (ancestors.find(({ id }) => id === entityId)) {
        return true;
      }
    }

    return false;
  }

  public getActions() {
    return [];
  }
}
