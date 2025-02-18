import { action, computed, autorun } from 'mobx';
import { z } from 'zod';

import Tree from '#domain/client/shared/model/note/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import { NoteTypes, type NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '#domain/client/app/model/note/EventBus';
import PersistedObject from '#domain/client/shared/model/abstract/PersistedObject';

import SortBehavior from './SortBehavior';

export default class TreeView {
  constructor(type: NoteTypes) {
    this.tree = new Tree({
      sort: this.sortBehavior.sort.bind(this.sortBehavior),
      type,
    });

    this.uiState = new PersistedObject(
      `note-explorer-${type}`,
      z
        .object({
          scroll: z.object({ x: z.number(), y: z.number() }),
          expanded: z.string().array(),
          selected: z.string().array(),
        })
        .partial(),
    );

    this.init();
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = container.resolve(SortBehavior);

  public readonly tree;

  private readonly uiState;

  private async init() {
    autorun(this.updateUIState.bind(this));

    if (this.uiState.value?.selected) {
      this.tree.select(this.uiState.value.selected, { includingAbsence: true });
    }

    if (this.uiState.value?.expanded) {
      this.tree.expand(this.uiState.value.expanded);
    }

    this.domainEventBus.on(DomainEventBus.eventNames.Created, ({ parentId }) => {
      this.tree.get(parentId)?.childrenQuery.invalidate();
    });
  }

  @computed
  public get canCollapse() {
    return this.tree.expandedNodeIds.size > 1; // 1 指 root 节点
  }

  @action.bound
  public collapseAll() {
    for (const nodeId of this.tree.expandedNodeIds) {
      const node = this.tree.get(nodeId);

      if (node && !node.isRoot) {
        node.isExpanded = false;
      }
    }
  }

  private updateUIState() {
    this.uiState.update({
      selected: Array.from(this.tree.selectedNodeIds),
      expanded: Array.from(this.tree.expandedNodeIds),
    });
  }

  public async disableDescendantsBy(movingNotes: NoteVO[]) {
    for (const nodeId of this.tree.unselectableNodeIds) {
      const node = this.tree.get(nodeId);

      if (node) {
        node.isUnselectable = false;
      }
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
