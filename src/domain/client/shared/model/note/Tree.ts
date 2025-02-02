import { difference } from 'lodash-es';
import { queryClient } from 'mobx-tanstack-query/preset';
import { action, observable, reaction } from 'mobx';

import type { NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import TreeNode from './TreeNode';
import DomainEventBus from './EventBus';

export default class Tree {
  constructor(private readonly options?: { sort?: (note1: NoteVO, note2: NoteVO) => number }) {
    this.root = this.createNode();
    this.eventBus.on(DomainEventBus.eventNames.Created, ({ parentId }) => {
      this.get(parentId)?.childrenQuery.invalidate();
    });
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  public readonly root: TreeNode;

  private readonly nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly remote = container.resolve(rpcToken);

  @observable public accessor selectedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor expandedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor unselectableNodeIds = new Set<TreeNode['id']>();

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
  public select(ids: MaybeArray<TreeNode['id']>, isAppend?: boolean) {
    if (!isAppend) {
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
      }
    }
  }

  public createNode(params?: { value: NoteVO; parent: TreeNode }) {
    const destroyController = new AbortController();
    const newNode = new TreeNode({
      value: params?.value,
      parent: params?.parent,
      sort: this.options?.sort,
      onDestroyed: () => {
        destroyController.abort();
        this.handleNodeDestroyed(newNode);
      },
    });

    this.nodesMap.set(newNode.id, newNode);

    if (params?.value) {
      if (this.expandedNodeIds.has(params.value.id)) {
        newNode.toggleExpand();
      }
    }

    reaction(
      () => newNode.isExpanded,
      (isExpanded) => (isExpanded ? this.expandedNodeIds.add(newNode.id) : this.expandedNodeIds.delete(newNode.id)),
      { signal: destroyController.signal },
    );

    reaction(
      () => newNode.isSelected,
      (isSelected) => (isSelected ? this.selectedNodeIds.add(newNode.id) : this.selectedNodeIds.delete(newNode.id)),
      { signal: destroyController.signal },
    );

    reaction(
      () => newNode.isUnselectable,
      (isSelected) => isSelected && this.selectedNodeIds.add(newNode.id),
      { signal: destroyController.signal },
    );

    return newNode;
  }

  // 展开并加载任意个指定节点（“加载”指拉取其子节点）。若某个节点的祖先节点没有被传入或存在于树中，则该节点会被无视
  public async expand(ids: MaybeArray<TreeNode['id']>) {
    const loadedIds = Array.from(this.nodesMap.values())
      .filter((node) => !node.isNeverLoaded)
      .map((node) => node.id);

    // 过滤出待展开 id 中，当前树中并未加载中/过的那些节点
    const parentsToLoad = difference(ids, loadedIds);
    const nodes = Object.groupBy(
      await this.remote.note.query.query({ parentId: parentsToLoad }),
      (note) => note.parentId!,
    );

    for (const [parentId, children] of Object.entries(nodes)) {
      queryClient.setQueryData(TreeNode.getChildrenQueryKey(parentId), children);
    }

    for (const id of ids) {
      this.expandedNodeIds.add(id);
    }
  }

  @action
  private handleNodeDestroyed(node: TreeNode) {
    this.nodesMap.delete(node.id);
    this.selectedNodeIds.delete(node.id);
    this.expandedNodeIds.delete(node.id);
    this.unselectableNodeIds.delete(node.id);
  }
}
