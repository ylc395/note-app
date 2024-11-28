import { action, computed, observable, runInAction } from 'mobx';
import assert from 'assert';

import type { HierarchyEntity, EntityLocator } from '../entity';

export interface TreeNodeView {
  title: string;
  icon: string | null;
}

export interface TreeNodeOptions<T extends HierarchyEntity> {
  onError?: (e: unknown) => void;
  sort?: (item1: T, item2: T) => number;
  isDisabled?: (item: T | null) => boolean;
  queryChildren: (signal: AbortController['signal']) => Promise<T[]>;
  toEntityLocator: (entity: T) => EntityLocator;
  toView?: (entity: T | null) => TreeNodeView;
  onSelect?: () => void;
  onNodeCreated?: (node: TreeNode<T>) => void;
}

export default class TreeNode<T extends HierarchyEntity = HierarchyEntity> {
  constructor(private readonly options: TreeNodeOptions<T>, params?: { entity: T; parent: TreeNode<T> }) {
    this.value = params?.entity;
    this.parent = params?.parent;
    this.entityLocator = params ? options.toEntityLocator(params.entity) : undefined;

    // this means it's a root node
    if (this.isRoot) {
      this.isExpanded = true;
    }

    if (this.parent) {
      this.parent.addChild(this);
    }

    options.onNodeCreated?.(this);
  }

  @observable private accessor value: T | undefined;

  @observable.ref public accessor parent: TreeNode<T> | undefined;

  @computed
  public get view() {
    return this.options.toView?.(this.value ?? null) ?? { title: '', icon: null };
  }

  @computed
  public get isDisabled() {
    return this.options.isDisabled?.(this.value || null) ?? false;
  }

  @computed
  public get isLoaded() {
    return Boolean(this._children);
  }

  @computed
  public get isExpandable() {
    return (this._children?.size ?? this.value?.childrenCount ?? 0) > 0;
  }

  @observable public accessor isExpanded = false;

  @observable public accessor isSelected = false;

  public readonly entityLocator?: EntityLocator;

  @observable.shallow private accessor _children: Set<TreeNode<T>> | undefined;

  @observable.ref public accessor loadingController: AbortController | undefined;

  private isDestroyed = false;

  public get id() {
    return this.entityLocator?.entityId || '_ROOT_ID';
  }

  public get isRoot() {
    return !this.parent;
  }

  @computed
  public get isLoading() {
    return Boolean(this.loadingController);
  }

  // 不含根节点
  @computed
  public get ancestors() {
    let parent = this.parent;
    const ancestors: TreeNode<T>[] = [];

    while (parent && parent.parent) {
      ancestors.unshift(parent);
      parent = parent.parent;
    }

    return ancestors;
  }

  public async load() {
    this.loadingController?.abort();
    const abortController = new AbortController();

    runInAction(() => {
      this.loadingController = abortController;
    });

    let children: T[] | undefined;

    try {
      children = await this.options.queryChildren(abortController.signal);
    } catch (e) {
      if (this.loadingController === abortController && (!this.isDestroyed || this.isExpanded)) {
        this.options.onError?.(e);
      }
    }

    if (children) {
      runInAction(() => {
        this._children = new Set(children.map((child) => new TreeNode(this.options, { entity: child, parent: this })));
      });
    }

    if (this.loadingController === abortController) {
      runInAction(() => {
        this.loadingController = undefined;
      });
    }
  }

  @action
  public addChild(node: TreeNode<T>) {
    assert(!this.isLoading && !this.isDestroyed, 'can not add child now');

    if (node.parent !== this) {
      node.parent?.removeChild(node);
      node.parent = this;
    }

    if (!this._children) {
      this._children = new Set();
    }

    this._children.add(node);
  }

  @action
  private removeChild(node: TreeNode<T>) {
    assert(!this.isLoading && !this.isDestroyed && this._children, 'can not remove child now');
    assert(node.parent === this, 'not a child to remove');

    this._children.delete(node);
    node.parent = undefined;
  }

  @computed
  public get children() {
    const nodes = Array.from(this._children || []);

    return this.options.sort
      ? nodes.toSorted(({ value: value1 }, { value: value2 }) => this.options.sort!(value1!, value2!))
      : nodes;
  }

  @action
  public toggleSelect(value?: boolean) {
    assert(!this.isDisabled, 'can not select disabled node');
    this.isSelected = value ?? !this.isSelected;
  }

  @action
  public toggleExpand(value?: boolean, forceLoad = false) {
    assert(this.isExpandable, 'can not expand node');
    this.isExpanded = value ?? !this.isExpanded;

    if (this.isExpanded) {
      if (!this.isLoaded || forceLoad) {
        this.load();
      }
    } else {
      this.loadingController?.abort();
      this.loadingController = undefined;
    }
  }

  @action
  public update(value: Partial<T>) {
    assert(this.value, 'can not update root node');
    assert(!value.id || value.id === this.id, 'can not update id');

    this.value = {
      ...this.value,
      ...value,
    };
  }

  @action
  public remove() {
    this.isDestroyed = true;
    this.parent?.removeChild(this);
    this.loadingController?.abort();
    this.loadingController = undefined;
  }
}
