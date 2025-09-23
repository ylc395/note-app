import { action, observable } from 'mobx';
import assert from 'assert';
import { compact } from 'lodash-es';

import type { NoteVO } from '#domain/shared/model/note';
import TreeNode from './TreeNode';

export default class Tree {
  constructor({
    expanded,
    ...options
  }: {
    expanded: TreeNode['id'][];
    sort?: (value1: NoteVO, value2: NoteVO) => number;
    onStateChanged?: (node: TreeNode, state: number) => void;
  }) {
    this.expandedNodeIds = observable(new Set(expanded));

    this.nodeOptions = {
      ...options,
      onCreated: (node: TreeNode) => {
        this.nodesMap.set(node.id, node);

        if (this.expandedNodeIds.has(node.id)) {
          node.toggleExpand(true);
        }
      },
      onDestroyed: action(({ id }: TreeNode) => {
        this.nodesMap.delete(id);
        this.expandedNodeIds.delete(id);
      }),

      onExpandedChanged: (node: TreeNode) => {
        if (node.isRoot) {
          return;
        }

        if (node.isExpanded) {
          this.expandedNodeIds.add(node.id);
        } else {
          this.expandedNodeIds.delete(node.id);
        }
      },
    };

    this.root = new TreeNode(this.nodeOptions);
  }

  private readonly nodeOptions;

  @observable.shallow private accessor nodesMap = new Map<TreeNode['id'], TreeNode>();

  public readonly expandedNodeIds;

  public readonly root: TreeNode;

  public get(id: string | null): TreeNode | undefined;
  public get(id: string[]): TreeNode[];
  public get(id: string | null | string[]) {
    if (Array.isArray(id)) {
      return compact(id.map((v) => this.nodesMap.get(v)));
    }

    if (id === null) {
      return this.root;
    }

    return this.nodesMap.get(id);
  }

  public addNode(value: NoteVO) {
    const parentNode = this.get(value.parentId);

    if (!parentNode) {
      return;
    }

    const node = new TreeNode({ value, parent: parentNode, ...this.nodeOptions });
    parentNode.addChild(node);
  }

  public updateNode({ id, parentId, ...patch }: Partial<NoteVO> & { id: NoteVO['id'] }) {
    const node = this.get(id);
    const oldParentNode = node?.parent;
    const newParentNode = parentId !== undefined && this.get(parentId);

    if (!node) {
      return;
    }

    assert(node.value);
    node.setValue({ ...node.value, ...patch, ...(parentId !== undefined ? { parentId } : null) });

    if (parentId === undefined || oldParentNode?.id === parentId) {
      return;
    }

    if (newParentNode && newParentNode.children) {
      node.moveTo(newParentNode);
    } else {
      node.remove();
    }
  }

  public toggle(id: TreeNode['id'] | null, state: number, value?: boolean) {
    const node = this.get(id);

    if (!node) {
      return;
    }

    node.toggleState(state, value);
  }
}
