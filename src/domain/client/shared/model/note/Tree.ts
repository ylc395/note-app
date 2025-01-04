import { observable, action, computed } from 'mobx';
import { first, keyBy } from 'lodash-es';
import assert from 'assert';

import type { MaybeArray } from '#utils/collection';
import type { NoteVO } from '#domain/shared/model/note';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import TreeNode from './TreeNode';

export default class Tree {
  private readonly remote = container.resolve(rpcToken);

  public readonly root = new TreeNode();

  // 不含根节点
  @observable.shallow private accessor nodesMap: Record<TreeNode['id'], TreeNode> = {};

  @computed
  private get allNodes() {
    return [...Object.values(this.nodesMap), this.root];
  }

  @computed
  public get selectedNodes() {
    return this.allNodes.filter((node) => node.isSelected);
  }

  // 不包括根节点
  @computed
  public get loadedNodes() {
    return this.allNodes.filter((node) => node.isLoaded && !node.isRoot);
  }

  public get unselectableNodes() {
    return this.allNodes.filter((node) => node.isUnselectable);
  }

  // 不包括根节点(根节点总是展开的，返回它意义不大)
  @computed
  public get expandedNodes() {
    return this.allNodes.filter((node) => node.isExpanded && !node.isRoot);
  }

  public getNode(id: TreeNode['id']) {
    if (id === this.root.id) {
      return this.root;
    }

    const node = this.nodesMap[id];

    if (!node) {
      assert.fail(`no node for id ${id}`);
    }

    return node;
  }

  public hasNode(id: TreeNode['id']) {
    assert(id !== this.root.id, 'can not judge root id');
    return Boolean(this.nodesMap[id]);
  }

  @action
  public removeNode(node: TreeNode | TreeNode['id']) {
    let _node: TreeNode;

    if (typeof node === 'string') {
      if (!this.hasNode(node)) {
        return;
      }
      _node = this.getNode(node);
    } else {
      assert(this.nodesMap[node.id] !== node, 'can not remove node');
      _node = node;
    }

    _node.remove();
    delete this.nodesMap[_node.id];
  }

  // 新增一个节点。若该节点的父节点不存在，则不会被新增
  @action.bound
  public addNode(value: NoteVO) {
    assert(!this.hasNode(value.id) && value.id !== this.root.id, 'node existed');
    const parent = value.parentId ? this.nodesMap[value.parentId] : this.root;

    if (!parent) {
      return;
    }

    const newNode = new TreeNode(value ? { value, parent } : undefined);
    this.nodesMap[newNode.id] = newNode;
  }

  // 更新现存的节点。若更新后的节点的父节点不存在，该节点会被移除
  @action.bound
  public update(entity: MaybeArray<Partial<NoteVO> & { id: NoteVO['id'] }>) {
    for (const patch of Array.isArray(entity) ? entity : [entity]) {
      if (!this.hasNode(patch.id)) {
        continue;
      }

      const node = this.getNode(patch.id);
      const oldParentId = node.parent!.isRoot ? null : node.parent!.id;

      if (typeof patch.parentId !== 'undefined' && patch.parentId !== oldParentId) {
        const newParent = patch.parentId ? this.hasNode(patch.parentId) && this.getNode(patch.parentId) : this.root;

        if (newParent) {
          newParent.addChild(node);
        } else {
          this.removeNode(node);
        }
      }

      node.updateValue(patch);
    }
  }

  // 选中指定的节点。其余的节点将被取消选中
  @action
  public select(ids: MaybeArray<TreeNode['id']>) {
    for (const selected of this.selectedNodes) {
      selected.toggleSelect(false);
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      this.nodesMap[id]?.toggleSelect(true);
    }
  }

  // 加载任意个指定节点（“加载”指拉取其子节点）。若某个节点的祖先节点没有被传入或存在于树中，则该节点无法加载
  public async load(nodeIds: TreeNode['id'][]) {
    if (!this.root.isLoaded) {
      await this.root.load();
    }

    const unloadedNodeIds = nodeIds.filter((id) => !this.hasNode(id) || !this.getNode(id).isLoaded);
    const newValues =
      unloadedNodeIds.length > 0 ? await this.remote.note.query.query({ parentId: unloadedNodeIds }) : [];

    const newValuesMap = keyBy(newValues, (v) => v.id);

    newValues.sort((a, b) => {
      let currentA: NoteVO | undefined = a;
      let currentB: NoteVO | undefined = b;

      while (currentA && currentB) {
        if (currentA.id === b.id) return -1;
        if (currentB.id === a.id) return 1;

        currentA = currentA.parentId
          ? this.hasNode(currentA.parentId)
            ? this.getNode(currentA.parentId).value
            : newValuesMap[currentA.parentId]
          : undefined;

        currentB = currentB.parentId
          ? this.hasNode(currentB.parentId)
            ? this.getNode(currentB.parentId).value
            : newValuesMap[currentB.parentId]
          : undefined;
      }

      return 0;
    });

    for (const value of newValues) {
      this.addNode(value);
    }
  }

  public async expand(nodeIds: TreeNode['id'][]) {
    for (const nodeId of nodeIds) {
      if (this.hasNode(nodeId)) {
        this.getNode(nodeId).toggleExpand(true);
      }
    }
  }

  public async reveal(id: NoteVO['id'], options?: { select?: boolean }) {
    let ancestors: Array<{ id: NoteVO['id'] }> | undefined = this.hasNode(id) ? this.getNode(id).ancestors : undefined;

    if (!ancestors) {
      ancestors = await this.remote.note.queryPath.query(id);

      const parent = first(ancestors);

      // 父节点存在，但目标节点却不存在的情况：加载一下目标父节点
      if (parent) {
        await this.getNode(parent.id).load();
      }
    }

    const ids = ancestors.map(({ id }) => id);
    await this.expand(ids);

    if (options?.select) {
      this.select([id]);
    }
  }
}
