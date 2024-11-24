import { debounce, once } from 'lodash-es';
import { action, computed, autorun } from 'mobx';
import { number, object, string, infer as ZodInfer } from 'zod';

import type Tree from '#domain/client/shared/model/abstract/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityId, HierarchyEntity, UpdatedEvent } from '#domain/client/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import EventBus from '#domain/client/app/infra/EventBus';

import RenameBehavior from './RenameBehavior';
import SortBehavior from './SortBehavior';
import { type Events, EventNames } from './events';
import UIState from '../UIState';

export const uiStateSchema = object({
  scroll: object({ x: number(), y: number() }),
  expanded: string().array(),
  selected: string().array(),
}).partial();

type ExplorerUIState = ZodInfer<typeof uiStateSchema>;

export default abstract class Explorer<T extends HierarchyEntity> extends EventBus<Events> {
  protected readonly remote = container.resolve(rpcToken);
  protected abstract submitRename(param: { id: EntityId; name: string }): Promise<void>;
  public readonly rename = new RenameBehavior({ onSubmit: this.submitRename.bind(this) });
  public readonly sorter = new SortBehavior();
  public abstract readonly tree: Tree<T>;
  public abstract readonly uiState: UIState<ExplorerUIState>;

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
    this.emit(EventNames.Revealed, id);
  }
}
