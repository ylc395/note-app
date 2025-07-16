import { z } from 'zod';
import { action, observable, reaction, runInAction, when } from 'mobx';

import { NoteTypes, NoteVO } from '#domain/shared/model/note';
import type { MaybeArray } from '#utils/collection';

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
    this.uiState = new PersistedMap(`note-explorer-tree-${options.type}`, schema, {});
    this.init();
  }

  @observable.ref public accessor root: TreeNode | undefined;

  @observable.shallow private accessor nodesMap = new Map<TreeNode['id'], TreeNode>();

  private readonly destroyController = new AbortController();

  private readonly uiState;

  @observable private accessor selectedNodeIds = new Set<TreeNode['id']>();

  @observable private accessor highlightedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor expandedNodeIds = new Set<TreeNode['id']>();

  @observable public accessor unselectableNodeIds = new Set<TreeNode['id']>();

  private async init() {
    await when(() => this.uiState.isReady, { signal: this.destroyController.signal });

    const selectedIds = this.uiState.get('selected');
    const expandedIds = this.uiState.get('expanded');

    runInAction(() => {
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
    });

    runInAction(() => {
      this.root = this.createNode();
    });

    reaction(
      () => Array.from(this.selectedNodeIds),
      (ids) => this.uiState.set('selected', ids),
      { signal: this.destroyController.signal },
    );

    reaction(
      () => Array.from(this.expandedNodeIds),
      (ids) => this.uiState.set('expanded', ids),
      { signal: this.destroyController.signal },
    );
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
      const node = this.get(nodeId);

      if (node) {
        node.setIsUnselectable(false);
      }
    }

    for (const id of ids) {
      const node = this.get(id);

      if (node) {
        node.setIsUnselectable(true);
      }
    }
  }

  @action
  public select(ids: MaybeArray<TreeNode['id']>, options?: { append?: boolean }) {
    if (!options?.append) {
      for (const nodeId of this.selectedNodeIds) {
        this.get(nodeId)?.toggleSelect(false);
      }
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      this.get(id)?.toggleSelect(true);
    }
  }

  @action
  public highlight(ids: MaybeArray<TreeNode['id']> | null) {
    for (const nodeId of this.highlightedNodeIds) {
      this.get(nodeId)?.setIsHighlighted(false);
    }

    if (!ids) {
      return;
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      this.get(id)?.setIsHighlighted(true);
    }
  }

  @action
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
      onDestroyed: action(() => {
        abortController.abort();

        if (params) {
          this.nodesMap.delete(params.parent.id);
        }
      }),
    });

    (
      [
        ['isExpanded', this.expandedNodeIds],
        ['isSelected', this.selectedNodeIds],
        ['isUnselectable', this.unselectableNodeIds],
        ['isHighlighted', this.highlightedNodeIds],
      ] as const
    ).forEach(([attr, set]) => {
      reaction(
        () => newNode[attr],
        (v) => (v ? set.add(newNode.id) : set.delete(newNode.id)),
        { signal: abortController.signal },
      );
    });

    this.nodesMap.set(newNode.id, newNode);

    return newNode;
  }

  public destroy() {
    this.destroyController.abort();
    this.root?.destroy();
  }
}
