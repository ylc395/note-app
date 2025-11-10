import { action, computed, observable, reaction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';

import { normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { differenceBy, without } from 'lodash-es';

export default class TreeNode {
  constructor({
    value,
    parent,
    ...options
  }: {
    value?: NoteVO;
    parent?: TreeNode;
    sort?: (note1: NoteVO, note2: NoteVO) => number;
    onDestroyed?: (node: TreeNode) => void;
    onCreated?: (node: TreeNode) => void;
    onExpandedChanged?: (node: TreeNode) => void;
    onStateChanged?: (node: TreeNode, state: number) => void;
  }) {
    this.setValue(value);
    this.isActive = parent?.isActive ?? false;
    this.parent = parent;
    this.options = options;

    if (this.isRoot) {
      this.toggleExpand(true);
    }

    this.childrenQuery = createQuery(
      ({ signal }) => {
        return this.remote.note.query.query({ parentId: value?.id ?? null }, { signal });
      },
      {
        refetchOnWindowFocus: true,
        abortSignal: this.destroyController.signal,
        queryKey: ['notes', { parentId: value?.id ?? null }],
        options: () => ({
          enabled: this.isExpanded && this.isActive,
        }),
      },
    );

    if (options.onDestroyed) {
      this.destroyController.signal.addEventListener('abort', options.onDestroyed.bind(null, this), { once: true });
    }

    options.onCreated?.(this);
    reaction(() => this.childrenQuery.result.data, this.setChildren, { signal: this.destroyController.signal });
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  @observable private accessor isActive;

  public parent?: TreeNode;

  @observable public accessor isExpanded = false;

  @observable public accessor value: NoteVO | undefined;

  @observable private accessor state = 0;

  private readonly childrenQuery;

  private readonly destroyController = new AbortController();

  @observable.shallow public accessor children: TreeNode[] | undefined; // 对 children 必须采用整体替换的方式，而不能使用 push / splice 等原地更改的方式。因为 <Key> 组件检测不到这样的变动

  private childrenMap?: Map<TreeNode['id'], TreeNode>;

  public get id() {
    return this.value?.id ?? '__ROOT_ID__';
  }

  public get ancestors() {
    const nodes: TreeNode[] = [];
    let current = this.parent;

    while (current) {
      nodes.unshift(current);
      current = current.parent;
    }

    return nodes;
  }

  @computed
  public get title() {
    return this.value ? normalizeTitle(this.value) : '';
  }

  @computed
  public get icon() {
    return this.value?.icon ?? null;
  }

  @computed
  private get childrenCount() {
    return this.children?.length ?? this.value?.childrenCount;
  }

  @computed
  public get isLeaf() {
    return this.childrenCount === 0;
  }

  public get isRoot() {
    return !this.value;
  }

  @computed
  public get sortedChildren() {
    if (!this.options.sort) {
      return this.children;
    }

    return this.children?.toSorted(({ value: value1 }, { value: value2 }) => this.options.sort!(value1!, value2!));
  }

  @action
  public toggleExpand(value?: boolean) {
    this.isExpanded = value ?? !this.isExpanded;
    this.options.onExpandedChanged?.(this);
  }

  public is(state: number) {
    return Boolean(this.state & state);
  }

  @action
  public setValue(value: TreeNode['value']) {
    if (this.value && value) {
      // 确保是对同一个 note 的更新
      assert(this.value.id === value.id, 'can not setValue');
    }

    this.value = value;
    return this;
  }

  @action
  public setActive(value: boolean) {
    this.isActive = value;

    if (!this.children) {
      return;
    }

    for (const child of this.children) {
      child.setActive(value);
    }
  }

  @action
  public moveTo(targetParent: TreeNode) {
    this.remove(false);
    targetParent.addChild(this);
  }

  @action
  public remove(destroyed = true) {
    assert(this.parent?.children);
    this.parent.children = without(this.parent.children, this);
    this.parent.childrenMap?.delete(this.id);

    if (destroyed) {
      this.destroy();
    }
  }

  @action
  public addChild(node: TreeNode) {
    assert(this.children && this.childrenMap);
    this.children = [...this.children, node];
    this.childrenMap.set(node.id, node);
    node.parent = this;
  }

  @action
  public toggleState(flag: number, value?: boolean) {
    if (typeof value === 'boolean') {
      if (value) {
        this.state |= flag;
      } else {
        this.state &= ~flag;
      }
    } else {
      this.state ^= flag;
    }

    this.options.onStateChanged?.(this, flag);
    return this;
  }

  @action
  private readonly setChildren = (children?: NoteVO[]) => {
    if (!children) {
      return;
    }

    let newChildren: TreeNode[];

    if (!this.children) {
      newChildren = children.map((note) => new TreeNode({ value: note, parent: this, ...this.options }));
    } else {
      newChildren = [];

      for (const note of children) {
        const node =
          this.childrenMap?.get(note.id)?.setValue(note) ||
          new TreeNode({ value: note, parent: this, ...this.options });

        newChildren.push(node);
      }

      const childrenToRemove = differenceBy(this.children, newChildren, (child) => child.id);

      for (const child of childrenToRemove) {
        child.destroy();
      }
    }

    this.children = newChildren;
    this.childrenMap = new Map(this.children.map((child) => [child.id, child]));
  };

  @action
  private destroy() {
    for (const child of this.children || []) {
      child.destroy();
    }

    this.destroyController.abort();
  }
}
