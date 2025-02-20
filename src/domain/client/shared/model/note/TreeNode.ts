import { action, computed, observable } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';

import type { NoteTypes, NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type Tree from './Tree';

export default class TreeNode {
  constructor({
    value,
    parent,
    type,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
    tree: Tree;
    type: NoteTypes;
    sort?: (note1: NoteVO, note2: NoteVO) => number;
    onDestroyed: () => void;
  }) {
    this.setValue(value);

    this.options = options;
    this.parent = parent;
    this.childrenQuery = createQuery(
      ({ signal }) => {
        return this.remote.note.query.query({ parentId: value?.id ?? null, type }, { signal });
      },
      {
        select: (notes) => notes.toSorted(options.sort),
        abortSignal: this.destroyController.signal,
        options: () => ({
          queryKey: TreeNode.getChildrenQueryKey({ parentId: value?.id ?? null, type }),
          enabled: this.isExpanded && this.options.tree.isActive,
        }),
      },
    );
  }

  public get id() {
    return this.value?.id ?? '__ROOT_ID__';
  }

  private readonly remote = container.resolve(rpcToken);

  private readonly parent?: TreeNode;

  private readonly options;

  @observable.ref public accessor value: NoteVO | undefined;

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
      assert(this.value.id === value.id, 'can not setValue');
    }

    this.value = value;
  }

  @action
  public toggleExpand(value?: boolean) {
    this.isExpanded = value ?? !this.isExpanded;
  }

  @action
  public toggleSelect(value?: boolean) {
    this.isSelected = value ?? !this.isSelected;
  }

  @action
  public destroy() {
    this.options.onDestroyed();
    this.destroyController.abort();
  }

  public static getChildrenQueryKey(params: { parentId: NoteVO['parentId']; type: NoteTypes }) {
    return ['notes', params];
  }
}
