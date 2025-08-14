import { action, computed, observable } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';

import type { NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

enum TreeNodeStates {
  Expanded = 1 << 0,
  Selected = 1 << 1,
  Unselectable = 1 << 2,
  Highlighted = 1 << 3,
}

export default class TreeNode {
  constructor({
    value,
    parent,
    isExpanded,
    isSelected,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
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
        return this.remote.note.query.query({ parentId: value?.id ?? null }, { signal });
      },
      {
        refetchOnWindowFocus: true,
        select: (notes) => notes.toSorted(options.sort),
        abortSignal: this.destroyController.signal,
        queryKey: ['notes', { parentId: value?.id ?? null }],
        options: () => ({
          enabled: this.isExpanded,
        }),
      },
    );

    this.destroyController.signal.addEventListener('abort', options.onDestroyed, { once: true });
  }

  public get id() {
    return this.value?.id ?? '__ROOT_ID__';
  }

  private readonly remote = container.resolve(rpcToken);

  public parent?: TreeNode;

  private readonly options;

  @observable public accessor value: NoteVO | undefined;

  @observable private accessor state = 0;

  public readonly childrenQuery;

  public readonly destroyController = new AbortController();

  @computed
  public get childrenCount() {
    return this.childrenQuery.result.data?.length ?? this.value?.childrenCount;
  }

  @computed
  public get isLeaf() {
    return this.childrenCount === 0;
  }

  public get isRoot() {
    return !this.value;
  }

  @computed
  public get isExpanded() {
    return Boolean(this.state & TreeNodeStates.Expanded);
  }

  @computed
  public get isSelected() {
    return Boolean(this.state & TreeNodeStates.Selected);
  }

  @computed
  public get isUnselectable() {
    return Boolean(this.state & TreeNodeStates.Unselectable);
  }

  @computed
  public get isHighlighted() {
    return Boolean(this.state & TreeNodeStates.Highlighted);
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
  private toggleState(flag: TreeNodeStates, value?: boolean) {
    if (typeof value === 'boolean') {
      if (value) {
        this.state |= flag;
      } else {
        this.state &= ~flag;
      }
    } else {
      this.state ^= flag;
    }
  }

  public toggleExpand(value?: boolean) {
    this.toggleState(TreeNodeStates.Expanded, value);
  }

  public toggleSelect(value?: boolean) {
    this.toggleState(TreeNodeStates.Selected, value);
  }

  public setIsUnselectable(value: boolean) {
    this.toggleState(TreeNodeStates.Unselectable, value);
  }

  public setIsHighlighted(value: boolean) {
    this.toggleState(TreeNodeStates.Highlighted, value);
  }

  @action
  public destroy() {
    this.options.onDestroyed();
  }
}
