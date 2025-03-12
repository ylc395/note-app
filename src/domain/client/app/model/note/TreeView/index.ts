import { action, computed } from 'mobx';

import Tree from '#domain/client/shared/model/note/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import { NoteTypes, type NoteVO } from '#domain/shared/model/note';
import DomainEventBus, { type UpdatedEvent } from '#domain/client/app/model/note/EventBus';

import SortBehavior from './SortBehavior';
import NewNoteEditor from './NewNoteEditor';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';

export default class TreeView {
  constructor(private readonly type: NoteTypes) {
    this.tree = new Tree({
      sort: this.sortBehavior.sort.bind(this.sortBehavior),
      type,
    });

    this.newNoteEditor = this.createNewNoteEditor();
    this.domainEventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated], this.handleUpdated);
  }

  private createNewNoteEditor = () => {
    let isExpanded: boolean | undefined;
    let parentNode: TreeNode | undefined;

    return new NewNoteEditor({
      type: this.type,
      onInit: (value) => {
        parentNode = value.parentId ? this.tree.get(value.parentId) : undefined;

        if (parentNode) {
          isExpanded = parentNode.isExpanded;
          parentNode.toggleExpand(true);
        }
      },
      onReset: (value) => {
        // 如果取消了新建流程，则把父节点的展开状态弄回原样
        if (!value && parentNode && typeof isExpanded === 'boolean') {
          parentNode.toggleExpand(isExpanded);
        }
      },
    });
  };

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = container.resolve(SortBehavior);

  public readonly newNoteEditor;

  public readonly tree;

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
}
