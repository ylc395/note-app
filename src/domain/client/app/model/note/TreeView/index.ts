import { action, computed } from 'mobx';

import Tree from '#domain/client/shared/model/note/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import { NoteTypes, type NoteVO } from '#domain/shared/model/note';
import DomainEventBus, { type UpdatedEvent } from '#domain/client/app/model/note/EventBus';

import SortBehavior from './SortBehavior';
import NewNoteEditor from './NewNoteEditor';

export default class TreeView {
  constructor(type: NoteTypes) {
    this.tree = new Tree({
      sort: this.sortBehavior.sort.bind(this.sortBehavior),
      type,
    });

    this.domainEventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated],
      this.handleUpdated.bind(this),
    );
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = container.resolve(SortBehavior);

  public readonly newNoteEditor = new NewNoteEditor();

  public readonly tree;

  private handleUpdated({ parentId, id }: UpdatedEvent) {
    if (parentId !== undefined) {
      const node = this.tree.get(id);

      if (node && node.value?.parentId !== parentId) {
        node.childrenQuery.invalidate();
      }

      this.tree.get(parentId)?.childrenQuery.invalidate();
    }
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
