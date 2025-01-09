import { action, computed, observable, reaction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { getChildrenNoteQueryKey } from './queryKeys';

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
    this.value = value;
    this.options = options;

    this.childrenQuery = createQuery(
      async () => {
        return this.remote.note.query.query({ parentId: this.value?.id ?? null });
      },
      {
        queryKey: getChildrenNoteQueryKey(this.value?.id ?? null),
        abortSignal: this.removeController.signal,
        onDone: this.setChildren.bind(this),
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

    this.init();
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  public readonly parent?: TreeNode;

  public readonly value: NoteVO | undefined;

  @observable public accessor isUnselectable = false;

  @observable public accessor isExpanded = false;

  @observable public accessor isSelected = false;

  @observable public accessor isLeaf = false;

  private readonly childrenQuery;

  @observable.ref private accessor children: TreeNode[] | undefined;

  @computed
  public get isLoading() {
    return this.childrenQuery.result.isLoading;
  }

  @computed
  public get sortedChildren() {
    if (this.options.sort) {
      return this.children?.toSorted(({ value: note1 }, { value: note2 }) => this.options.sort!(note1!, note2!));
    }

    return this.children;
  }

  // 该节点是否“从未加载过，且并不正在加载”
  @computed
  public get isNeverLoaded() {
    return this.childrenQuery.result.isPending && !this.childrenQuery.result.isFetching;
  }

  @action
  private setChildren(notes: NoteVO[]) {
    this.isLeaf = !this.isRoot && notes.length === 0;
    this.children?.forEach((child) => child.destroy());

    const children = notes.map((note) => new TreeNode({ value: note, parent: this, ...this.options }));
    this.children = children;
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
  private init() {
    this.isExpanded = this.isRoot; // 根节点总是被自动展开
    this.isLeaf = this.value?.childrenCount === 0;
    this.options.onCreated(this);
  }

  @action
  public toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  private destroy() {
    this.removeController.abort();
    this.options.onDestroyed(this);
  }
}
