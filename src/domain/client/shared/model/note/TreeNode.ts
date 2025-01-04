import { action, computed, observable } from 'mobx';
import assert from 'assert';

import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

export default class TreeNode {
  constructor(params?: { value: NoteVO; parent: TreeNode }) {
    this.init(params);
  }

  private readonly remote = container.resolve(rpcToken);

  public parent?: TreeNode;

  @observable public accessor value: NoteVO | undefined;

  @observable public accessor isUnselectable = false;

  @observable public accessor isExpanded = false;

  @observable public accessor isSelected = false;

  @observable public accessor isLoaded = false;

  @observable public accessor isLeaf = false;

  @observable.shallow public accessor children: Set<TreeNode> | undefined;

  @observable.ref private accessor loadingController: AbortController | undefined;

  public get id() {
    return this.value?.id || '_ROOT_ID';
  }

  public get isRoot() {
    return !this.parent;
  }

  @computed
  public get isLoading() {
    return Boolean(this.loadingController);
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
  private init(params?: { value: NoteVO; parent: TreeNode }) {
    this.parent = params?.parent;
    this.value = params?.value;

    if (this.isRoot) {
      this.isExpanded = true;
    }

    if (this.parent) {
      this.parent.addChild(this);
    }

    if (params?.value && params.value.childrenCount > 0) {
      this.isLeaf = true;
    }
  }

  public async load() {
    if (this.isLoaded) {
      return;
    }

    const abortController = new AbortController();

    this.loadingController?.abort();
    this.loadingController = abortController;
    let children: NoteVO[] | undefined;

    try {
      children = await this.remote.note.query.query(
        { parentId: this.isRoot ? null : this.id },
        { signal: abortController.signal },
      );
    } catch (e) {
      if (!abortController.signal.aborted) {
        throw e;
      }

      return;
    } finally {
      if (this.loadingController === abortController) {
        this.loadingController = undefined;
      }
    }

    this.children = new Set(children.map((child) => new TreeNode({ value: child, parent: this })));
    this.isLoaded = true;
  }

  // 将一个节点纳为自己的子节点。它与原父节点的关系将被解除
  @action
  public addChild(node: TreeNode) {
    assert(!this.children?.has(node), 'can not add node twice');

    this.isLeaf = true;
    this.isLoaded = true;

    if (node.parent !== this) {
      node.parent?.removeChild(node);
      node.parent = this;
    }

    if (!this.children) {
      this.children = new Set();
    }

    this.children.add(node);
  }

  @action
  private removeChild(node: TreeNode) {
    assert(node.parent === this, 'not a child to remove');

    this.children?.delete(node);
    node.parent = undefined;

    if (this.children?.size === 0) {
      this.children = undefined;
      this.isLeaf = true;
    }
  }

  @action
  public toggleSelect(value?: boolean) {
    assert(!this.isUnselectable, 'can not select disabled node');
    this.isSelected = value ?? !this.isSelected;
  }

  @action
  public toggleExpand(value?: boolean) {
    assert(this.children, 'can not expand leaf');
    assert(!this.isRoot, 'can not expand root');

    this.isExpanded = value ?? !this.isExpanded;

    if (this.isExpanded) {
      this.load();
    } else {
      this.loadingController?.abort();
    }
  }

  @action
  public updateValue(value: Partial<NoteVO>) {
    assert(this.value, 'can not update root node');
    assert(!value.id || value.id === this.id, 'can not update id');

    this.value = {
      ...this.value,
      ...value,
    };
  }

  // 不要在 Tree 以外的地方用
  @action
  public remove() {
    this.loadingController?.abort();
    this.parent?.removeChild(this);
  }
}
