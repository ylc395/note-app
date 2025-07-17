import { action, autorun, computed, observable } from 'mobx';
import assert from 'assert';

import Tree from '#domain/client/shared/model/note/Tree';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import container from '#utils/singletonContainer';
import { NoteTypes, type NewNoteDTO, type NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '#domain/client/app/model/note/EventBus';

import SortBehavior from './SortBehavior';
import NewNoteForm from './NewNoteForm';
import Workbench from '../../Workbench';

export default class TreeView {
  constructor(private readonly noteType: NoteTypes) {
    this.tree = new Tree({
      sort: this.sortBehavior.sort.bind(this.sortBehavior),
      type: noteType,
    });

    this.domainEventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated],
      this.tree.updateNode.bind(this.tree),
    );

    autorun(this.autoHighlight.bind(this));
  }

  private readonly domainEventBus = container.resolve(DomainEventBus);

  private readonly workbench = container.resolve(Workbench);

  private readonly remote = container.resolve(rpcToken);

  public readonly sortBehavior = container.resolve(SortBehavior);

  @observable.shallow public accessor newNoteFormMap = new Map<string, NewNoteForm>();

  public readonly tree;

  @action
  public initNewNoteForm(value: Pick<NewNoteDTO, 'parentId' | 'title'> & { isAutoSubmit?: boolean }) {
    const parentNode = this.tree.get(value.parentId ?? null);
    assert(parentNode);

    const isExpanded = parentNode.isExpanded;
    const newNoteForm = new NewNoteForm({
      ...value,
      type: this.noteType,
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

  @computed
  public get canCollapse() {
    return this.tree.expandedNodeIds.size > 1; // 1 指 root 节点
  }

  @action.bound
  public collapseAll() {
    for (const nodeId of this.tree.expandedNodeIds) {
      const node = this.tree.get(nodeId);

      if (node && !node.isRoot) {
        node.toggleExpand(false);
      }
    }
  }

  private autoHighlight() {
    this.tree.highlight(this.workbench.currentEditor?.noteId ?? null);
  }

  public async disableDescendantsBy(movingNotes: NoteVO[]) {
    if (movingNotes.some(({ type }) => type !== this.noteType)) {
      this.tree.setUnselectable(this.tree.allNodes.map(({ id }) => id));
      return;
    }

    const noteIds = movingNotes.map(({ id }) => id);
    const nodeIdToSetUnselect = new Set<string>();
    const collectDescendantIds = (nodeId: string) => {
      const node = this.tree.get(nodeId);

      if (node) {
        nodeIdToSetUnselect.add(node.id);
        const childIds = node.childrenQuery.result.data?.map(({ id }) => id) ?? [];

        for (const childId of childIds) {
          collectDescendantIds(childId);
        }
      }
    };

    for (const noteId of noteIds) {
      collectDescendantIds(noteId);
    }

    this.tree.setUnselectable(Array.from(nodeIdToSetUnselect));
  }
}
