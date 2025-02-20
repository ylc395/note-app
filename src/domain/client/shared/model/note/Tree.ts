import { difference } from 'lodash-es';
import { queryClient } from 'mobx-tanstack-query/preset';
import { action, observable, reaction } from 'mobx';

import { NoteTypes, NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import TreeNode from './TreeNode';

export default class Tree {
  constructor(private readonly options: { sort?: (note1: NoteVO, note2: NoteVO) => number; type: NoteTypes }) {
    this.root = this.createNode();
  }

  @observable public accessor isActive = false;

  public readonly root: TreeNode;

  private readonly nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor selectedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor expandedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor unselectableNodeIds = new Set<TreeNode['id']>();

  @action
  public setActive(value: boolean) {
    this.isActive = value;
  }

  public get(id: string | null) {
    if (!id) {
      return this.root;
    }

    return this.nodesMap.get(id);
  }

  @action
  public setUnselectable(ids: TreeNode['id'][]) {
    for (const nodeId of this.unselectableNodeIds.values()) {
      const node = this.nodesMap.get(nodeId);

      if (node) {
        node.isUnselectable = false;
      }
    }

    for (const id of ids) {
      const node = this.nodesMap.get(id);

      if (node) {
        node.isUnselectable = true;
      }
    }
  }

  @action
  public select(ids: MaybeArray<TreeNode['id']>, options?: { append?: boolean; includingAbsence?: boolean }) {
    if (!options?.append) {
      for (const nodeId of this.selectedNodeIds) {
        const node = this.nodesMap.get(nodeId);

        if (node) {
          node.isSelected = false;
        }
      }
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      const node = this.nodesMap.get(id);

      if (node) {
        node.isSelected = true;
      } else if (options?.includingAbsence) {
        this.selectedNodeIds.add(id);
      }
    }
  }

  public createNode(params?: { value: NoteVO; parent: TreeNode }) {
    const newNode = new TreeNode({
      type: this.options.type,
      value: params?.value,
      parent: params?.parent,
      sort: this.options?.sort,
      tree: this,
      onDestroyed: action(() => {
        this.nodesMap.delete(newNode.id);
        this.selectedNodeIds.delete(newNode.id);
        this.expandedNodeIds.delete(newNode.id);
        this.unselectableNodeIds.delete(newNode.id);
      }),
    });

    this.nodesMap.set(newNode.id, newNode);

    if (newNode.isRoot || this.expandedNodeIds.has(newNode.id)) {
      newNode.toggleExpand(true);
    }

    if (this.selectedNodeIds.has(newNode.id)) {
      newNode.toggleSelect(true);
    }

    if (!newNode.isRoot) {
      reaction(
        () => newNode.isExpanded,
        (isExpanded) => (isExpanded ? this.expandedNodeIds.add(newNode.id) : this.expandedNodeIds.delete(newNode.id)),
        { signal: newNode.destroyController.signal },
      );
    }

    reaction(
      () => newNode.isSelected,
      (isSelected) => (isSelected ? this.selectedNodeIds.add(newNode.id) : this.selectedNodeIds.delete(newNode.id)),
      { signal: newNode.destroyController.signal },
    );

    reaction(
      () => newNode.isUnselectable,
      (isSelected) => isSelected && this.selectedNodeIds.add(newNode.id),
      { signal: newNode.destroyController.signal },
    );

    return newNode;
  }

  // 展开并加载任意个指定节点（“加载”指拉取其子节点）。若某个节点的祖先节点没有被传入或存在于树中，则该节点会被无视
  public async expand(ids: MaybeArray<TreeNode['id']>) {
    if (ids.length === 0) {
      return;
    }

    const loadedIds = Array.from(this.nodesMap.values())
      // 该节点是否“从未加载过，且并不正在加载”
      .filter((node) => !(node.childrenQuery.result.isPending && !node.childrenQuery.result.isFetching))
      .map((node) => node.id);

    // 过滤出待展开 id 中，当前树中并未加载中/过的那些节点
    const parentsToLoad = difference(ids, loadedIds);
    const nodes = Object.groupBy(
      await this.remote.note.query.query({ parentId: parentsToLoad }),
      (note) => note.parentId!,
    );

    for (const [parentId, children] of Object.entries(nodes)) {
      queryClient.setQueryData(TreeNode.getChildrenQueryKey({ parentId, type: this.options.type }), children);
    }

    for (const id of ids) {
      this.expandedNodeIds.add(id);
    }
  }
}
