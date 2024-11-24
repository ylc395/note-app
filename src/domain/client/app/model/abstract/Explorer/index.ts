import { debounce, once } from 'lodash-es';
import { action, computed, autorun } from 'mobx';

import type Tree from '#domain/client/shared/model/abstract/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityId, HierarchyEntity, UpdatedEvent } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import type EventBus from '#domain/client/app/infra/EventBus';

import RenameBehavior from './RenameBehavior';
import SortBehavior from './SortBehavior';
import { type Events, EventNames } from './events';
import type { ExplorerUIState, create as createUIState } from './uiState';

export { create as createUIState } from './uiState';

export type { Events } from './events';

export default abstract class Explorer<T extends HierarchyEntity> {
  protected readonly remote = container.resolve(rpcToken);

  public abstract readonly events: EventBus<Events>;

  protected abstract submitRename(param: { id: EntityId; name: string }): Promise<void>;
  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename.bind(this) });
  public readonly sorter = new SortBehavior();
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

    autorun(this.persistUIState.bind(this));
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

  private persistUIState() {
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
}
