import { action, computed, observable } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';

import type { NoteTypes, NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type Tree from './Tree';

export default class TreeNode {
  constructor({
    value,
    parent,
    type,
    isExpanded,
    isSelected,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
    tree: Tree;
    type: NoteTypes;
    isExpanded: boolean;
    isSelected: boolean;
    sort?: (note1: NoteVO, note2: NoteVO) => number;
    onDestroyed: () => void;
  }) {
    this.setValue(value);

    this.options = options;
    this.parent = parent;

    if (this.isRoot || isExpanded) {
      this.toggleExpand(true);
    }

    if (isSelected) {
      this.toggleSelect(true);
    }

    this.childrenQuery = createQuery(
      ({ signal }) => {
        return this.remote.note.query.query({ parentId: value?.id ?? null, type }, { signal });
      },
      {
        refetchOnWindowFocus: true,
        select: (notes) => notes.toSorted(options.sort),
        abortSignal: this.destroyController.signal,
        queryKey: TreeNode.getChildrenQueryKey({ parentId: value?.id ?? null, type }),
        options: () => ({
          enabled: !this.isLeaf && this.isExpanded,
        }),
      },
    );

    this.destroyController.signal.addEventListener('abort', options.onDestroyed, { once: true });
  }

  public get id() {
    return this.value?.id ?? '__ROOT_ID__';
  }

  private readonly remote = container.resolve(rpcToken);

  public readonly parent?: TreeNode;

  private readonly options;

  @observable public accessor value: NoteVO | undefined;

  @observable public accessor isSelected = false;

  @observable public accessor isExpanded = false;

  @observable public accessor isUnselectable = false;

  @computed
  public get isLeaf() {
    return this.value?.childrenCount === 0;
  }

  public get isRoot() {
    return !this.value;
  }

  public readonly childrenQuery;

  public readonly destroyController = new AbortController();

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
  public setValue(value: TreeNode['value']) {
    if (this.value && value) {
      // 确保是对同一个 note 的更新
      assert(this.value.id === value.id, 'can not setValue');
    }

    this.value = value;
  }

  @action
  public toggleExpand(value?: boolean) {
    this.isExpanded = value ?? !this.isExpanded;

    // value 为 undefined 说明是用户正常触发的，这种情况下获取最新数据
    if (this.isExpanded && value === undefined) {
      this.childrenQuery.invalidate();
    }
  }

  @action
  public toggleSelect(value?: boolean) {
    this.isSelected = value ?? !this.isSelected;
  }

  public setIsUnselectable(value: boolean) {
    this.isUnselectable = value;
  }

  @action
  public destroy() {
    this.options.onDestroyed();
  }

  public static getChildrenQueryKey(params: { parentId: NoteVO['parentId']; type: NoteTypes }) {
    return ['notes', params];
  }
}
