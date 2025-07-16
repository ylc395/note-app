import { z } from 'zod';
import { action, autorun, observable, reaction, when } from 'mobx';

import { NoteTypes, NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';
import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';

import PersistedMap from '../abstract/PersistedMap';
import TreeNode from './TreeNode';

const schema = z
  .object({
    scroll: z.object({ x: z.number(), y: z.number() }),
    expanded: z.string().array(),
    selected: z.string().array(),
  })
  .partial();

export default class Tree {
  constructor(private readonly options: { sort?: (note1: NoteVO, note2: NoteVO) => number; type: NoteTypes }) {
    this.root = this.createNode();
    this.uiState = new PersistedMap(`note-explorer-tree-${options.type}`, schema, {});

    when(() => this.uiState.isReady, this.init.bind(this));
  }

  public readonly root: TreeNode;

  private readonly nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly remote = container.resolve(rpcToken);

  private readonly uiState;

  @observable public accessor selectedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor expandedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor unselectableNodeIds = new Set<TreeNode['id']>();

  private async init() {
    autorun(() => this.uiState.set('selected', Array.from(this.selectedNodeIds)));
    autorun(() => this.uiState.set('expanded', Array.from(this.expandedNodeIds)));

    const selectedIds = this.uiState.get('selected');
    const expandedIds = this.uiState.get('expanded');

    if (selectedIds) {
      for (const selectedId of selectedIds) {
        this.selectedNodeIds.add(selectedId);
      }
    }

    if (expandedIds) {
      for (const expandedId of expandedIds) {
        this.expandedNodeIds.add(expandedId);
      }
    }
  }

  public get(id: string | null) {
    if (id === null) {
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
  public select(ids: MaybeArray<TreeNode['id']>, options?: { append?: boolean }) {
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
      }
    }
  }

  public createNode(params?: { value: NoteVO; parent: TreeNode }) {
    const abortController = new AbortController();
    const newNode = new TreeNode({
      type: this.options.type,
      value: params?.value,
      parent: params?.parent,
      sort: this.options?.sort,
      isSelected: params ? this.selectedNodeIds.has(params.value.id) : false,
      isExpanded: params ? this.expandedNodeIds.has(params.value.id) : false,
      tree: this,
      onDestroyed: () => {
        abortController.abort();

        if (params) {
          this.nodesMap.delete(params.parent.id);
        }
      },
    });

    reaction(
      () => newNode.isExpanded,
      (v) => (v ? this.expandedNodeIds.add(newNode.id) : this.expandedNodeIds.delete(newNode.id)),
      { signal: abortController.signal },
    );

    reaction(
      () => newNode.isSelected,
      (v) => (v ? this.selectedNodeIds.add(newNode.id) : this.selectedNodeIds.delete(newNode.id)),
      { signal: abortController.signal },
    );

    reaction(
      () => newNode.isUnselectable,
      (v) => (v ? this.unselectableNodeIds.add(newNode.id) : this.unselectableNodeIds.delete(newNode.id)),
      { signal: abortController.signal },
    );

    this.nodesMap.set(newNode.id, newNode);

    return newNode;
  }

  public destroy() {
    this.root.destroy();
  }
}
