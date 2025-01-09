import { action, computed, autorun } from 'mobx';
import { z } from 'zod';

import Tree from '#domain/client/shared/model/note/Tree';
import TreeNode from '#domain/client/shared/model/note/TreeNode';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { NoteVO } from '#domain/shared/model/note';

import SortBehavior from './SortBehavior';
import UIState from '../../common/UIState';
import { eventBus as domainEventBus, EventNames as DomainEventNames } from '../eventBus';

export default class Explorer {
  constructor() {
    this.init();
  }

  protected readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = new SortBehavior();

  public readonly tree = new Tree({ sort: this.sortBehavior.sort.bind(this.sortBehavior) });

  public readonly uiState = new UIState(
    'explorer',
    z
      .object({
        scroll: z.object({ x: z.number(), y: z.number() }),
        expanded: z.string().array(),
        selected: z.string().array(),
      })
      .partial(),
  );

  private async init() {
    domainEventBus.on(DomainEventNames.MoveStart, this.updateUnselectable);
    autorun(this.updateUIState.bind(this));

    if (this.uiState.value?.expanded) {
      await this.tree.expand(this.uiState.value.expanded);
    }

    if (this.uiState.value?.selected) {
      this.tree.select(this.uiState.value.selected);
    }
  }

  @computed
  public get canCollapse() {
    return this.tree.expandedNodes.size > 1; // 1 指 root 节点
  }

  @action.bound
  public collapseAll() {
    for (const node of this.tree.expandedNodes) {
      if (!node.isRoot) {
        node.isExpanded = false;
      }
    }
  }

  private updateUIState() {
    const getId = ({ id }: TreeNode) => id;

    this.uiState.update({
      selected: Array.from(this.tree.selectedNodes).map(getId),
      expanded: Array.from(this.tree.expandedNodes).map(getId),
    });
  }

  private async updateUnselectable(movingNotes: NoteVO[]) {
    for (const node of this.tree.unselectableNodes) {
      node.isUnselectable = false;
    }

    const noteIds = movingNotes.map(({ id }) => id);
    const ancestors = noteIds.flatMap((id) => this.tree.get(id)?.ancestors || []);
    const unknownNodes = noteIds.filter((id) => !this.tree.get(id));
    const unknownAncestors =
      unknownNodes.length > 0 ? Object.values(await this.remote.note.queryPaths.query(unknownNodes)).flat() : [];

    const nodeIdToSetUnselect = [...noteIds, ...[...unknownAncestors, ...ancestors].map(({ id }) => id)];
    this.tree.setUnselectable(nodeIdToSetUnselect);
  }
}
