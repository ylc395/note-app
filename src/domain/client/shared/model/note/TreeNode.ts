import { action, computed, observable, reaction } from 'mobx';
import { createQuery } from 'mobx-tanstack-query/preset';
import assert from 'assert';
import { differenceBy, without } from 'lodash-es';

import { getFakeNote, normalizeTitle, type NoteVO } from '#domain/shared/model/note';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

export interface NodeOptions {
  value?: NoteVO;
  parent?: TreeNode;
  isFake?: boolean; // 该节点是个占位符，不代表真实 note
  initialExpanded?: boolean | ((node: TreeNode) => boolean);
  sort?: (note1: NoteVO, note2: NoteVO) => number;
  onDestroyed?: (node: TreeNode) => void;
  onCreated?: (node: TreeNode) => void;
  onExpandedChanged?: (node: TreeNode) => void;
  onStateChanged?: (node: TreeNode, state: number) => void;
}

export default class TreeNode {
  constructor({ value, parent, ...options }: NodeOptions) {
    this.setValue(value);
    this.parent = parent;
    this.options = options;

    const isExpanded =
      this.isRoot ||
      (typeof options.initialExpanded === 'function'
        ? options.initialExpanded(this)
        : Boolean(options.initialExpanded));

    this.toggleExpand(isExpanded);
    options.onCreated?.(this);

    this.childrenQuery = createQuery(
      ({ signal }) => this.remote.note.query.query({ parentId: value?.id ?? null }, { signal }),
      {
        // 全局 staleTime 为 0，这里覆盖为 Infinity，使得 setChildrenCache 写入的数据不会因 stale 而被 refetchOnMount 重新请求，
        staleTime: Infinity,
        abortSignal: this.destroyController.signal,
        queryKey: ['notes', { parentId: value?.id ?? null }] as const,
        options: () => ({
          enabled: this.isExpanded && !this.options.isFake,
        }),
      },
    );

    if (options.onDestroyed) {
      this.destroyController.signal.addEventListener('abort', options.onDestroyed.bind(null, this), { once: true });
    }

    reaction(
      () => this.childrenQuery.data,
      (children) => {
        // 在 tanstack query 中，query 上的任何状态更新（例如 isStale 的更新）都会触发 mobx-tanstack-query 的 reaction
        // 我们通过 isStale 来判断，是不是需要更新 children
        if (!this.childrenQuery.isStale && children) {
          this.setChildren(children);
        }
      },
      {
        signal: this.destroyController.signal,
        fireImmediately: true,
      },
    );
  }

  private readonly options;

  private readonly remote = container.resolve(rpcToken);

  public parent?: TreeNode;

  @observable public accessor isExpanded = false;

  public get isFake() {
    return this.options.isFake;
  }

  @observable public accessor value: NoteVO | undefined;

  @observable private accessor state = 0;

  private readonly childrenQuery;

  private readonly destroyController = new AbortController();

  public setChildrenCache(notes: NoteVO[]) {
    this.childrenQuery.setData(notes);
  }

  @observable.shallow public accessor children: Readonly<TreeNode[]> | undefined; // 对 children 必须采用整体替换的方式，而不能使用 push / splice 等原地更改的方式。因为 <Key> 组件检测不到这样的变动

  private childrenMap?: Map<TreeNode['id'], TreeNode>;

  public get id() {
    return this.value?.id ?? TreeNode.ROOT_ID;
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

  public addFakeChild(params: Pick<NoteVO, 'title' | 'mimeType'>) {
    if (!this.children) {
      this.children = [];
    }

    if (!this.childrenMap) {
      this.childrenMap = new Map();
    }

    const fakeNode = new TreeNode({
      isFake: true,
      value: getFakeNote({ parentId: this.id, ...params }),
    });

    this.addChild(fakeNode);

    return fakeNode;
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
  private setChildren = (children: NoteVO[]) => {
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

  public static readonly ROOT_ID = '__ROOT_ID__';
}
