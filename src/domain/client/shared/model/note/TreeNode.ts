import { action, computed, observable, reaction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { getChildrenNoteQueryKey } from './queryKeys';
import { keyBy } from 'lodash-es';

export default class TreeNode {
  constructor({
    value,
    parent,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
    sort?: (note1: NoteVO, note2: NoteVO) => number;
    onCreated: (node: TreeNode) => void;
    onDestroyed: (node: TreeNode) => void;
    onSelectToggle: (node: TreeNode, value: boolean) => void;
    onExpandToggle: (node: TreeNode, value: boolean) => void;
    onUnselectableToggle: (node: TreeNode, value: boolean) => void;
  }) {
    this.parent = parent;
    this.options = options;
    this.setValue(value);

    this.childrenQuery = createQuery(
      async () => {
        return this.remote.note.query.query({ parentId: this.value?.id ?? null });
      },
      {
        queryKey: getChildrenNoteQueryKey(this.value?.id ?? null),
        abortSignal: this.removeController.signal,
        options: () => ({
          enabled: this.isExpanded,
        }),
      },
    );

    reaction(
      () => this.isSelected,
      (value) => this.options.onSelectToggle(this, value),
      { signal: this.removeController.signal },
    );
    reaction(
      () => this.isExpanded,
      (value) => this.options.onExpandToggle(this, value),
      { signal: this.removeController.signal },
    );
    reaction(
      () => this.isUnselectable,
      (value) => this.options.onUnselectableToggle(this, value),
      { signal: this.removeController.signal },
    );
    reaction(
      () => this.childrenQuery.result.data,
      (notes) => notes && this.setChildren(notes),
      { signal: this.removeController.signal },
    );

    this.options.onCreated(this);
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  public readonly parent?: TreeNode;

  @observable.ref public value: NoteVO | undefined;

  @observable public accessor isSelected = false;

  @observable public accessor isExpanded = false;

  @observable public accessor isUnselectable = false;

  @observable public accessor isLeaf = false;

  private readonly childrenQuery;

  @computed
  public get isLoading() {
    return this.childrenQuery.result.isLoading;
  }

  @computed
  public get children() {
    const children = this.childrenMap ? Object.values(this.childrenMap) : [];

    if (this.options.sort) {
      return children.sort(({ value: note1 }, { value: note2 }) => this.options.sort!(note1!, note2!));
    }

    return children;
  }

  // 该节点是否“从未加载过，且并不正在加载”
  @computed
  public get isNeverLoaded() {
    return this.childrenQuery.result.isPending && !this.childrenQuery.result.isFetching;
  }

  @observable.shallow private childrenMap?: Record<TreeNode['id'], TreeNode>;

  @action
  private setChildren(notes: NoteVO[]) {
    this.isLeaf = !this.isRoot && notes.length === 0;

    if (!this.childrenMap) {
      this.childrenMap = keyBy(
        notes.map((note) => new TreeNode({ value: note, parent: this, ...this.options })),
        (node) => node.id,
      );

      return;
    }

    const notesMap = keyBy(notes, (note) => note.id);

    for (const [id, node] of Object.entries(this.childrenMap)) {
      if (!(id in notesMap)) {
        node.destroy();
        delete this.childrenMap[id];
      }
    }

    for (const note of notes) {
      const node = this.childrenMap[note.id];

      if (node) {
        node.setValue(note);
      } else {
        this.childrenMap[note.id] = new TreeNode({ value: note, parent: this, ...this.options });
      }
    }
  }

  private readonly removeController = new AbortController();

  public get id() {
    return this.value?.id || '_ROOT_ID';
  }

  public get isRoot() {
    return !this.parent;
  }

  // 不含根节点
  public get ancestors() {
    let parent = this.parent;
    const ancestors: TreeNode[] = [];

    while (parent && parent.parent) {
      ancestors.unshift(parent);
      parent = parent.parent;
    }

    return ancestors;
  }

  @action
  private setValue(value: TreeNode['value']) {
    this.value = value;
    this.isExpanded = this.isRoot; // 根节点总是被自动展开
    this.isLeaf = this.value?.childrenCount === 0;

    if (this.isLeaf) {
      this.destroyChildren();
    }
  }

  @action
  public toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  @action
  private destroyChildren() {
    for (const child of this.children) {
      child.destroy();
    }

    this.childrenMap = undefined;
  }

  private destroy() {
    this.destroyChildren();
    this.removeController.abort();
    this.options.onDestroyed(this);
  }
}
