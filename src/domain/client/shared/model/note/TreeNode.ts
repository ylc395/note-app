import { action, computed, observable } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

export default class TreeNode {
  constructor({
    value,
    parent,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
    sort?: (note1: NoteVO, note2: NoteVO) => number;
    onDestroyed?: () => void;
  }) {
    this.options = options;
    this.parent = parent;
    this.setValue(value);

    this.childrenQuery = createQuery(
      ({ signal }) => {
        return this.remote.note.query.query({ parentId: value?.id ?? null }, { signal });
      },
      {
        queryKey: TreeNode.getChildrenQueryKey(value?.id ?? null),
        select: (notes) => notes.toSorted(options.sort),
        abortSignal: this.destroyController.signal,
        options: () => ({
          enabled: this.isExpanded,
        }),
      },
    );
  }

  public get id() {
    return this.value?.id ?? '__ROOT_ID__';
  }

  private readonly remote = container.resolve(rpcToken);

  public readonly parent?: TreeNode;

  private readonly options;

  @observable.ref public accessor value: NoteVO | undefined;

  @observable public accessor isSelected = false;

  @observable public accessor isExpanded = false;

  @observable public accessor isUnselectable = false;

  @computed
  public get isLeaf() {
    return this.value?.childrenCount === 0;
  }

  public readonly childrenQuery;

  @computed
  public get isLoading() {
    return this.childrenQuery.result.isLoading;
  }

  // 该节点是否“从未加载过，且并不正在加载”
  public get isNeverLoaded() {
    return this.childrenQuery.result.isPending && !this.childrenQuery.result.isFetching;
  }

  private readonly destroyController = new AbortController();

  public get isRoot() {
    return !this.value;
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
  protected setValue(value: TreeNode['value']) {
    this.value = value;
    this.isExpanded = this.isRoot; // 根节点总是被自动展开
  }

  @action
  public toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  public destroy() {
    this.options.onDestroyed?.();
    this.destroyController.abort();
  }

  public static getChildrenQueryKey(parentId: NoteVO['parentId']) {
    return ['notes', { parentId }];
  }
}
