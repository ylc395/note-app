import { observable, action, computed, makeObservable } from 'mobx';
import { Emitter } from 'strict-event-emitter';
import pull from 'lodash/pull';
import differenceWith from 'lodash/differenceWith';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';

import type { HierarchyEntity } from '../../../../shared/model/entity';

export interface TreeNode<T = void> {
  readonly id: string;
  title: string;
  children?: TreeNode<T>[];
  parent: TreeNode<T> | null;
  isExpanded: boolean;
  isSelected: boolean;
  isUndroppable?: boolean;
  isLeaf?: boolean;
  attributes?: T; // root node has no attribute;
}

export type TreeNodeEntity = HierarchyEntity;

export interface TreeOptions<T extends TreeNodeEntity> {
  from?: T[];
}

const ROOT_NODE_KEY = '__root-node';

export interface SelectEvent {
  multiple?: boolean;
  reason?: string;
}

export default abstract class Tree<T = unknown, E extends TreeNodeEntity = TreeNodeEntity> extends Emitter<{
  nodeSelected: [TreeNode['id'] | null, SelectEvent];
  nodeExpanded: [TreeNode['id'] | null];
}> {
  readonly root: TreeNode<T>;

  constructor(protected readonly options?: TreeOptions<E>) {
    super();
    this.root = this.generateRoot();

    if (options?.from) {
      this.fromEntities(options.from);
    }

    makeObservable(this);
  }

  sort(parentId: TreeNode['id'], cb: (node1: TreeNode<T>, node2: TreeNode<T>) => number, recursive: boolean) {
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

  protected abstract toNode(entity: E | null): Pick<TreeNode<T>, 'isLeaf' | 'title' | 'attributes'>;

  @observable.shallow private nodes: Record<TreeNode['id'], TreeNode<T>> = {};

  @computed
  get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded && node !== this.root);
  }

  @computed
  get selectedNodes() {
    return Object.values(this.nodes).filter((node) => node.isSelected);
  }

  @computed
  get undroppableNodes() {
    return Object.values(this.nodes).filter((node) => node.isUndroppable);
  }

  @action
  private generateRoot() {
    const root = observable({
      isLeaf: false,
      ...this.toNode(null),
      id: ROOT_NODE_KEY,
      children: [],
      parent: null,
      isExpanded: true,
      isSelected: false,
    }) satisfies TreeNode<T>;

    this.nodes[root.id] = root;
    return root;
  }

  getNode(id: TreeNode['id'] | null): TreeNode<T>;
  getNode(id: TreeNode['id'] | null, safe: true): TreeNode<T> | undefined;
  getNode(id: TreeNode['id'] | null, safe?: true) {
    if (id === this.root.id) {
      throw new Error('invalid id');
    }

    const node = id ? this.nodes[id] : this.root;

    if (!node && !safe) {
      throw new Error(`no node for id ${id}`);
    }

    return node;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hasNode(node: any): node is TreeNode<T> {
    return Object.values(this.nodes).includes(node);
  }

  @action
  removeNodes(ids: TreeNode['id'][]) {
    for (const id of ids) {
      const node = this.getNode(id);

      if (!node.parent?.children) {
        throw new Error('no children');
      }

      pull(node.parent.children, node);

      delete this.nodes[id];

      if (node.children) {
        this.removeNodes(map(node.children, 'id'));
      }
    }
  }

  @action
  private createNode(entity: E) {
    if (entity.id === this.root.id) {
      throw new Error('invalid id');
    }

    const parent = this.getNode(entity.parentId, true);

    if (!parent) {
      throw new Error('no parent');
    }

    parent.isLeaf = false;

    const node: TreeNode<T> = observable({
      isLeaf: false,
      ...this.toNode(entity),
      id: entity.id,
      parent,
      isExpanded: false,
      isSelected: false,
    });

    if (!parent.children) {
      parent.children = [];
    }

    parent.children.push(node);
    this.nodes[entity.id] = node;
  }

  @action
  setChildren(entities: E[], parentId: TreeNode['id'] | null) {
    const parentNode = this.getNode(parentId);

    if (parentNode.children) {
      const toRemoveIds = map(
        differenceWith(parentNode.children, entities, (a, b) => a.id === b.id),
        'id',
      );
      this.removeNodes(toRemoveIds);
    }

    if (entities.length === 0) {
      parentNode.children = [];
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

      if (!node.parent?.children) {
        throw new Error('no parent or siblings');
      }

      Object.assign(node, this.toNode(entity));

      if (node.parent.id === (entity.parentId || this.root.id)) {
        continue;
      }

      pull(node.parent.children, node);

      const newParent = this.getNode(entity.parentId, true);

      if (!newParent) {
        continue;
      }

      if (!newParent.children) {
        newParent.children = [];
      }

      newParent.children.push(node);
      newParent.isLeaf = false;
      node.parent = newParent;
    }
  }

  @action
  toggleExpand(id: TreeNode['id'] | null) {
    const node = this.getNode(id);

    if (node.isLeaf) {
      throw new Error('can not expand a leaf');
    }

    node.isExpanded = !node.isExpanded;

    if (node.isExpanded) {
      this.emit('nodeExpanded', id);
    }
  }

  @action
  toggleSelect(id: TreeNode['id'] | null, options?: SelectEvent) {
    const node = this.getNode(id);

    node.isSelected = !node.isSelected;

    if (node.isSelected) {
      this.emit('nodeSelected', id, options || {});

      if (!options?.multiple) {
        for (const selected of this.selectedNodes) {
          selected !== node && (selected.isSelected = false);
        }
      }
    }
  }

  @action
  setSelected(ids: TreeNode['id'][]) {
    for (const selected of this.selectedNodes) {
      selected.isSelected = false;
    }

    for (const id of ids) {
      this.toggleSelect(id, { multiple: true });
    }
  }

  getSiblings(id: TreeNode['id']) {
    const { parent } = this.getNode(id);

    if (!parent?.children) {
      throw new Error('no parent');
    }

    return parent.children.filter(({ id: _id }) => _id !== id);
  }

  getAncestors(id: TreeNode['id']) {
    let parent = this.getNode(id).parent;
    const ancestors: TreeNode<T>[] = [];

    while (parent && parent !== this.root) {
      ancestors.unshift(parent);
      parent = parent.parent;
    }

    return ancestors;
  }

  private getDescendants(id: TreeNode['id'] | null): TreeNode<T>[] {
    const { children } = this.getNode(id);

    if (children) {
      return [...children, ...children.flatMap((child) => this.getDescendants(child.id))];
    }

    return [];
  }

  @action.bound
  collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
  }

  @action
  updateInvalidTargetNodes(id?: TreeNode['id']) {
    this.resetUndroppable();

    const selectedIds = id ? [id] : map(this.selectedNodes, 'id');

    for (const id of selectedIds) {
      const node = this.getNode(id);

      node.isUndroppable = true;
      (node.parent || this.root).isUndroppable = true;

      for (const descendant of this.getDescendants(id)) {
        descendant.isUndroppable = true;
      }
    }
  }

  @action
  resetUndroppable() {
    for (const node of this.undroppableNodes) {
      node.isUndroppable = false;
    }
  }

  private fromEntities(entities: E[]) {
    const descants: E[] = [];
    const roots: E[] = [];

    for (const entity of entities) {
      (entity.parentId ? descants : roots).push(entity);
    }

    const childrenGroup = groupBy(descants, 'parentId');
    const createChildrenNodes = (entities: E[]) => {
      for (const entity of entities) {
        this.createNode(entity);
        const children = childrenGroup[entity.id];
        children && createChildrenNodes(children);
      }
    };

    createChildrenNodes(roots);
  }
}
