import { observable, action, computed, makeObservable } from 'mobx';
import pull from 'lodash/pull';
import differenceWith from 'lodash/differenceWith';
import { Emitter } from 'strict-event-emitter';

import { getIds } from '../utils/collection';

export interface TreeNode {
  id: string;
  title: string;
  children?: TreeNode[];
  isLeaf: boolean;
  parent: TreeNode | null;
  isExpanded: boolean;
  isSelected: boolean;
  isVirtual?: true;
}

export interface Options {
  virtualRoot?: boolean;
  radio?: boolean;
}

export interface EntityWithParent {
  id: string;
  parentId: string | null;
}

const VIRTUAL_ROOT_NODE_KEY = 'virtual-root-node';

export default abstract class Tree<E extends EntityWithParent = EntityWithParent> extends Emitter<{
  nodeSelected: [TreeNode];
  nodeExpanded: [TreeNode];
}> {
  constructor(private readonly options?: Options) {
    super();
    makeObservable(this);
    if (options?.virtualRoot) {
      this.initVirtualRoot();
    }
  }

  sort(parentId: TreeNode['id'], cb: (node1: TreeNode, node2: TreeNode) => number, recursive: boolean) {
    const { children } = this.getNode(parentId);

    if (!children) {
      throw new Error('no children');
    }

    children.sort(cb);

    if (recursive) {
      for (const child of children) {
        this.sort(child.id, cb, true);
      }
    }
  }

  protected abstract toNode(entity: E | null): { title: string; isLeaf?: boolean };

  private nodes: Record<TreeNode['id'], TreeNode> = {};

  @computed
  get roots() {
    return this.virtualRoot ? [this.virtualRoot] : this._roots;
  }

  @computed
  get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded);
  }

  @computed
  get selectedNodes() {
    return Object.values(this.nodes).filter((node) => node.isSelected);
  }

  @observable
  private _roots: TreeNode[] = [];

  private virtualRoot?: TreeNode;

  @action
  private initVirtualRoot() {
    const virtualRoot = observable({
      id: VIRTUAL_ROOT_NODE_KEY,
      ...this.toNode(null),
      isLeaf: false,
      children: [],
      parent: null,
      isVirtual: true,
      isExpanded: true,
      isSelected: false,
    }) satisfies TreeNode;

    this.virtualRoot = virtualRoot;
    this.nodes[virtualRoot.id] = virtualRoot;
    this._roots = virtualRoot.children;
  }

  getNode(id: TreeNode['id'] | null) {
    const node = id ? this.nodes[id] : this.virtualRoot;

    if (!node) {
      throw new Error(`no node for id ${id}`);
    }

    return node;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasNode(node: any): node is TreeNode {
    return Object.values(this.nodes).includes(node);
  }

  @action
  removeNodes(ids: TreeNode['id'][]) {
    for (const id of ids) {
      const node = this.getNode(id);
      pull(node.parent?.children || this._roots, node);
      delete this.nodes[id];

      if (node.children) {
        this.removeNodes(getIds(node.children));
      }
    }
  }

  @action
  private createNode(entity: E) {
    let parent: TreeNode | null = null;

    if (entity.parentId) {
      parent = this.getNode(entity.parentId);
      parent.isLeaf = false;
    }

    const node: TreeNode = observable({
      id: entity.id,
      isLeaf: false,
      ...this.toNode(entity),
      parent,
      isExpanded: false,
      isSelected: false,
    });

    let siblings = this._roots;

    if (parent) {
      if (!parent.children) {
        parent.children = [];
      }

      siblings = parent.children;
    }

    siblings.push(node);
    this.nodes[entity.id] = node;
  }

  setChildren(entities: E[], parentId: TreeNode['id'] | null) {
    const children = parentId ? this.getNode(parentId).children : this._roots;

    if (children) {
      const toRemoveIds = getIds(differenceWith(children, entities, (a, b) => a.id === b.id));
      this.removeNodes(toRemoveIds);
    }

    if (entities.length === 0) {
      if (parentId) {
        this.getNode(parentId).children = [];
      } else {
        this._roots = [];
      }
    }

    this.updateTree(entities);
  }

  @action
  updateTree(entity: E | E[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      const node = this.nodes[entity.id];

      if (!node) {
        this.createNode(entity);
        continue;
      }

      Object.assign(node, this.toNode(entity));

      if (node.parent?.id === entity.parentId) {
        return;
      }

      pull(node.parent?.children || this._roots, node);
      const newParent = entity.parentId ? this.getNode(entity.parentId) : undefined;

      if (newParent) {
        if (!newParent.children) {
          newParent.children = [];
        }

        node.parent = newParent;
        newParent.children.push(node);
        newParent.isLeaf = false;
      } else {
        node.parent = null;
        this._roots.push(node);
      }
    }
  }

  @action
  toggleExpand(id: TreeNode['id']) {
    const node = this.getNode(id);

    if (node.isLeaf) {
      throw new Error('can not expand a leaf');
    }

    node.isExpanded = !node.isExpanded;

    if (node.isExpanded) {
      this.emit('nodeExpanded', node);
    }
  }

  @action
  toggleSelect(id: TreeNode['id'] | null) {
    const node = this.getNode(id);

    if (this.options?.radio && node.isSelected) {
      throw new Error('can not unselect node on radio tree');
    }

    node.isSelected = !node.isSelected;

    if (node.isSelected) {
      this.emit('nodeSelected', node);

      if (this.options?.radio) {
        for (const selected of this.selectedNodes) {
          selected !== node && (selected.isSelected = false);
        }
      }
    }
  }

  getSiblings(id: TreeNode['id']) {
    const { parent } = this.getNode(id);
    return (parent?.children || this._roots).filter(({ id: _id }) => _id !== id);
  }

  getAncestors(id: TreeNode['id']) {
    let parent = this.getNode(id).parent;
    const ancestors: TreeNode[] = [];

    while (parent) {
      ancestors.unshift(parent);
      parent = parent.parent;
    }

    return ancestors;
  }

  destroy() {
    this.removeAllListeners();
  }
}
