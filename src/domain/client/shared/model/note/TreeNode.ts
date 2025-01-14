import { action, computed, observable, reaction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import HierarchyEntity from '../abstract/HierarchyEntity';
import { getChildrenNoteQueryKey } from './queryKeys';

export default class TreeNode extends HierarchyEntity<NoteVO> {
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
    super();
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
      { signal: this.removeController.signal, fireImmediately: true },
    );

    this.options.onCreated(this);
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  public readonly parent?: TreeNode;

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

  @action
  protected override setChildren(notes: NoteVO[]) {
    this.isLeaf = !this.isRoot && notes.length === 0;
    super.setChildren(notes, (note) => new TreeNode({ value: note, parent: this, ...this.options }));
  }

  private readonly removeController = new AbortController();

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
  protected override setValue(value: TreeNode['value']) {
    super.setValue(value);
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
  public override destroy() {
    super.destroy();
    this.removeController.abort();
    this.options.onDestroyed(this);
  }
}
