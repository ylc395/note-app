import { observable, action, computed, makeObservable } from 'mobx';
import pull from 'lodash/pull';
import { Emitter } from 'strict-event-emitter';

export interface TreeNode {
  id: string;
  title: string;
  children: TreeNode[];
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
    const virtualRoot: TreeNode = observable({
      id: VIRTUAL_ROOT_NODE_KEY,
      ...this.toNode(null),
      isLeaf: false,
      children: [],
      parent: null,
      isVirtual: true,
      isExpanded: true,
      isSelected: false,
    });

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
    }
  }

  @action
  private createNode(entity: E) {
    if (entity.id === this.virtualRoot?.id) {
      throw new Error('invalid entity id');
    }

    let parent: TreeNode | null = null;

    if (entity.parentId) {
      parent = this.getNode(entity.parentId);
      parent.isLeaf = false;
    }

    const node: TreeNode = observable({
      id: entity.id,
      isLeaf: false,
      ...this.toNode(entity),
      children: [],
      parent,
      isExpanded: false,
      isSelected: false,
    });

    const siblings = parent?.children || this._roots;

    siblings.push(node);
    this.nodes[entity.id] = node;
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
        newParent.children.push(node);
        newParent.isLeaf = false;
      } else {
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
