import { action, computed, observable } from 'mobx';

import Tree from '#domain/client/shared/model/note/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import { NoteTypes, type NewNoteDTO, type NoteVO } from '#domain/shared/model/note';
import DomainEventBus, { type UpdatedEvent } from '#domain/client/app/model/note/EventBus';

import SortBehavior from './SortBehavior';
import NewNoteForm from './NewNoteForm';
import assert from 'assert';

export default class TreeView {
  constructor(private readonly type: NoteTypes) {
    this.tree = new Tree({
      sort: this.sortBehavior.sort.bind(this.sortBehavior),
      type,
    });

    this.domainEventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated], this.handleUpdated);
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = container.resolve(SortBehavior);

  @observable.shallow public accessor newNoteFormMap = new Map<string, NewNoteForm>();

  public readonly tree;

  public initNewNoteForm(value: Pick<NewNoteDTO, 'parentId' | 'title'> & { isAutoSubmit?: boolean }) {
    const parentNode = this.tree.get(value.parentId ?? null);
    assert(parentNode);

    const isExpanded = parentNode.isExpanded;
    const newNoteForm = new NewNoteForm({
      ...value,
      type: this.type,
      onCancel: () => {
        // 如果取消了新建流程，则把父节点的展开状态弄回原样
        if (typeof isExpanded === 'boolean') {
          parentNode.toggleExpand(isExpanded);
        }
      },
      onFinish: action(() => {
        this.newNoteFormMap.delete(parentNode.id);
      }),
    });

    this.newNoteFormMap.set(parentNode.id, newNoteForm);
    parentNode.toggleExpand(true);
  }

  @action.bound
  private handleUpdated({ parentId, id, ...patch }: UpdatedEvent) {
    const node = this.tree.get(id);

    if (parentId !== undefined) {
      if (node?.parent) {
        if ((node.parent.value?.id ?? null) !== parentId) {
          // 旧的父节点
          node.parent.childrenQuery.invalidate();

          if (node.parent.value) {
            node.parent.value.childrenCount -= 1;
          }
        }
      }

      const newParentNode = this.tree.get(parentId);

      if (newParentNode) {
        // 新的父节点
        newParentNode.childrenQuery.invalidate();

        // 根节点可能没有 value
        if (newParentNode.value) {
          newParentNode.value.childrenCount += 1;
        }
      }
    }

    if (node?.value) {
      node.setValue({ ...node.value, ...patch });
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

  public destroy() {
    this.tree.destroy();
  }
}
