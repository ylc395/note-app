import { action, autorun, computed, observable, when } from 'mobx';
import assert from 'assert';

import Tree from '#domain/client/shared/model/note/Tree';
import type TreeNode from '#domain/client/shared/model/note/TreeNode';
import container from '#utils/singletonContainer';
import type { NoteVO } from '#domain/shared/model/note';
import DomainEventBus from '#domain/client/app/model/note/EventBus';

import { arrayOf, type MaybeArray } from '#utils/collection';

import StarEventBus from '../../star/EventBus';
import Setting, { SortBy } from './Setting';
import UIState from './UIState';

export enum TreeNodeStates {
  Selected = 1 << 1,
  Unselectable = 1 << 2,
}

export default class TreeExplorer {
  constructor() {
    this.domainEventBus.on(DomainEventBus.eventNames.Updated, ({ id, payload }) => this.tree?.updateNode(id, payload));
    this.domainEventBus.on(DomainEventBus.eventNames.Created, (e) => this.tree?.addNode(e));
    this.domainEventBus.on(DomainEventBus.eventNames.Deleted, (e) => this.removeNode(e.noteId));

    this.starEventBus.on(StarEventBus.eventNames.Changed, ({ entityId, isStar }) =>
      this.tree?.updateNode(entityId, { isStar }),
    );

    when(() => this.uiState.isReady && this.settings.isReady, this.init.bind(this));
  }

  private init() {
    this.tree = new Tree({
      expanded: this.uiState.expanded,
      sort: this.sort.bind(this),
      onStateChanged: this.handleNodeStateChanged,
    });

    autorun(() => {
      if (this.tree) {
        this.uiState.expanded = Array.from(this.tree.expandedNodeIds);
      }
    });
  }

  @observable.ref public accessor tree: Tree | undefined;

  private readonly starEventBus = container.resolve(StarEventBus);

  private readonly domainEventBus = container.resolve(DomainEventBus);

  public readonly treeNodeSets = {
    selected: observable(new Set<TreeNode['id']>()),
    disabled: observable(new Set<TreeNode['id']>()),
  } as const;

  @computed
  public get selectedNode() {
    const id = Array.from(this.treeNodeSets.selected)[0];

    if (id) {
      const node = this.tree?.get(id);
      return node;
    }
  }

  private readonly uiState = new UIState();

  public readonly settings = new Setting();

  @computed
  public get canCollapse() {
    return Boolean(this.tree && this.tree.expandedNodeIds.size > 0);
  }

  @action.bound
  public collapseAll() {
    if (!this.tree) {
      return;
    }

    for (const nodeId of this.tree.expandedNodeIds) {
      const node = this.tree.get(nodeId);

      if (node && !node.isRoot) {
        node.toggleExpand(false);
      }
    }
  }

  private removeNode(id: NoteVO['id']) {
    this.tree?.get(id)?.remove();
  }

  private readonly handleNodeStateChanged = (node: TreeNode, state: number) => {
    if (state === TreeNodeStates.Selected) {
      if (node.is(TreeNodeStates.Selected)) {
        this.treeNodeSets.selected.add(node.id);
      } else {
        this.treeNodeSets.selected.delete(node.id);
      }
    }
  };

  @action
  public disableDescendantsBy(movingNotes: MaybeArray<NoteVO>) {
    const tree = this.tree;

    if (!tree) {
      return;
    }

    const notes = arrayOf(movingNotes);
    const noteIds = notes.map(({ id }) => id);
    const nodeIdToSetUnselect = new Set<string>();
    const collectDescendantIds = (nodeId: string) => {
      const node = tree.get(nodeId);

      if (node) {
        nodeIdToSetUnselect.add(node.id);
        const childIds = node.children?.map(({ id }) => id) ?? [];

        for (const childId of childIds) {
          collectDescendantIds(childId);
        }
      }
    };

    for (const noteId of noteIds) {
      collectDescendantIds(noteId);
    }

    for (const id of this.treeNodeSets.disabled) {
      tree.toggle(id, TreeNodeStates.Unselectable, false);
    }

    this.treeNodeSets.disabled.clear();

    for (const id of nodeIdToSetUnselect) {
      tree.toggle(id, TreeNodeStates.Unselectable, true);
      this.treeNodeSets.disabled.add(id);
    }
  }

  @action
  public select(ids: MaybeArray<TreeNode['id']>) {
    if (!this.tree) {
      return;
    }

    for (const nodeId of this.treeNodeSets.selected) {
      this.tree.toggle(nodeId, TreeNodeStates.Selected, false);
    }

    this.treeNodeSets.selected.clear();

    for (const id of arrayOf(ids)) {
      this.tree.toggle(id, TreeNodeStates.Selected, true);
      this.treeNodeSets.selected.add(id);
    }
  }

  private sort(entity1: NoteVO, entity2: NoteVO) {
    const FLAG = [SortBy.CreatedAtAsc, SortBy.TitleAsc, SortBy.UpdatedAtAsc].includes(this.settings.sortBy) ? 1 : -1;

    if ([SortBy.TitleAsc, SortBy.TitleDesc].includes(this.settings.sortBy)) {
      return entity1.title > entity2.title ? FLAG : -FLAG;
    }

    if ([SortBy.CreatedAtAsc, SortBy.CreatedAtDesc].includes(this.settings.sortBy)) {
      return entity1.createdAt > entity2.createdAt ? FLAG : -FLAG;
    }

    if ([SortBy.UpdatedAtAsc, SortBy.UpdatedAtDesc].includes(this.settings.sortBy)) {
      return entity1.updatedAt > entity2.updatedAt ? FLAG : -FLAG;
    }

    assert.fail('invalid sortBy');
  }
}
