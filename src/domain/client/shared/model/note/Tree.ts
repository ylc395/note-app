import { difference } from 'lodash-es';
import { action, observable } from 'mobx';

import type { NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import TreeNode from './TreeNode';
import { assert } from 'console';

export default class Tree {
  constructor(private readonly options?: { sort?: (note1: NoteVO, note2: NoteVO) => number }) {}

  public readonly root = this.createNode();

  private readonly nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly remote = container.resolve(rpcToken);

  @observable.shallow public readonly selectedNodes = new Set<TreeNode>();

  @observable.shallow public readonly expandedNodes = new Set<TreeNode>();

  @observable.shallow public readonly unselectableNodes = new Set<TreeNode>();

  public get(id: TreeNode['id']) {
    return this.nodesMap.get(id);
  }

  @action
  public setUnselectable(ids: TreeNode['id'][]) {
    for (const node of this.unselectableNodes.values()) {
      node.isUnselectable = false;
    }

    for (const id of ids) {
      const node = this.nodesMap.get(id);

      if (node) {
        node.isUnselectable = true;
      }
    }
  }

  @action
  public select(ids: MaybeArray<TreeNode['id']>, isAppend?: boolean) {
    if (!isAppend) {
      for (const node of this.selectedNodes) {
        node.isSelected = false;
      }
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      const node = this.nodesMap.get(id);

      if (node) {
        node.isSelected = true;
      }
    }
  }

  // 新增一个节点。若该节点的父节点不存在，则不会被新增
  @action.bound
  private addNode(value: NoteVO) {
    const parent = value.parentId ? this.nodesMap.get(value.parentId) : this.root;

    if (!parent) {
      return;
    }

    assert(!this.nodesMap.has(value.id), 'duplicated node');
    const newNode = this.createNode({ value, parent });
    this.nodesMap.set(newNode.id, newNode);

    return newNode;
  }

  private createNode(params?: { value: NoteVO; parent: TreeNode }) {
    return new TreeNode({
      value: params?.value,
      parent: params?.parent,
      sort: this.options?.sort,
      onDestroyed: this.handleNodeDestroyed.bind(this),
      onCreated: (node) => this.nodesMap.set(node.id, node),
      onExpandToggle: (node, value) => (value ? this.expandedNodes.add(node) : this.expandedNodes.delete(node)),
      onSelectToggle: (node, value) => (value ? this.selectedNodes.add(node) : this.selectedNodes.delete(node)),
      onUnselectableToggle: (node, value) =>
        value ? this.unselectableNodes.add(node) : this.unselectableNodes.delete(node),
    });
  }

  // 展开并加载任意个指定节点（“加载”指拉取其子节点）。若某个节点的祖先节点没有被传入或存在于树中，则该节点会被无视
  public async expand(ids: MaybeArray<TreeNode['id']>) {
    // 过滤出待展开 id 中，当前树中并未加载中/过的那些节点
    const parentsToLoad = difference(
      ids,
      Array.from(this.nodesMap.values().filter((node) => !node.isNeverLoaded)).map((node) => node.id),
    );

    const newChildren = (await this.remote.note.query.query({ parentId: parentsToLoad })).sort((child1, child2) => {
      if (child1.parentId === child2.id) return 1;
      if (child2.parentId === child1.id) return -1;
      return 0;
    });

    for (const child of newChildren) {
      const node = this.addNode(child);

      if (node) {
        node.isExpanded = true;
      }
    }
  }

  @action
  private handleNodeDestroyed(node: TreeNode) {
    this.nodesMap.delete(node.id);
    this.selectedNodes.delete(node);
    this.expandedNodes.delete(node);
    this.unselectableNodes.delete(node);
  }
}
