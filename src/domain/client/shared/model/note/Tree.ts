import { difference } from 'lodash-es';
import { queryClient } from 'mobx-tanstack-query/preset';
import { z } from 'zod';
import { action, autorun, observable, runInAction } from 'mobx';

import { NoteTypes, NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';
import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import PersistedObject from '../abstract/PersistedObject';
import TreeNode from './TreeNode';

export default class Tree {
  constructor(private readonly options: { sort?: (note1: NoteVO, note2: NoteVO) => number; type: NoteTypes }) {
    this.root = this.createNode();
    this.uiState = new PersistedObject(`note-explorer-${options.type}`, Tree.schema);

    this.init();
  }

  @observable public accessor isActive = false;

  public readonly root: TreeNode;

  private readonly nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly remote = container.resolve(rpcToken);

  private readonly uiState;

  @observable public accessor selectedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor expandedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor unselectableNodeIds = new Set<TreeNode['id']>();

  public init() {
    autorun(() => this.uiState.set('selected', Array.from(this.selectedNodeIds)));
    autorun(() => this.uiState.set('expanded', Array.from(this.expandedNodeIds)));

    const selectedIds = this.uiState.get('selected');
    const expandedIds = this.uiState.get('expanded');

    if (selectedIds) {
      this.select(selectedIds, { includingAbsence: true });
    }

    if (expandedIds) {
      this.expand(expandedIds);
    }
  }

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

    runInAction(() => {
      for (const id of ids) {
        this.expandedNodeIds.add(id);
      }
    });
  }

  private static readonly schema = z
    .object({
      scroll: z.object({ x: z.number(), y: z.number() }),
      expanded: z.string().array(),
      selected: z.string().array(),
    })
    .partial();
}
