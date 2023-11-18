import { observable, action, computed, makeObservable } from 'mobx';
import { Emitter } from 'strict-event-emitter';
import pull from 'lodash/pull';
import differenceWith from 'lodash/differenceWith';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';

import type { HierarchyEntity } from '../../../../shared/model/entity';

export interface TreeNode<T = unknown> {
  readonly id: string;
  readonly entity: T | null; // only root node has no entity;
  title: string;
  children: TreeNode<T>[];
  parent: TreeNode<T> | null; // only root node has no parent;
  isExpanded: boolean;
  isSelected: boolean;
  isValidTarget: boolean;
  isLoading: boolean;
  isLeaf: boolean;
}

const ROOT_NODE_ID = '__root-node';

export type SelectEvent = { reason?: 'drag'; multiple?: boolean };

type TreeEvents = {
  nodeSelected: [TreeNode['id'] | null, SelectEvent];
  nodeExpanded: [TreeNode['id'] | null];
};

const getDefaultNode = <T extends HierarchyEntity>() => ({
  isLeaf: false,
  isExpanded: false,
  isSelected: false,
  isValidTarget: true,
  isLoading: false,
  children: [] as TreeNode<T>[],
  title: '',
});

export default abstract class Tree<T extends HierarchyEntity = HierarchyEntity> extends Emitter<TreeEvents> {
  readonly root: TreeNode<T> = observable({
    entity: null,
    parent: null,
    id: ROOT_NODE_ID,
    ...getDefaultNode<T>(),
  });

  constructor(entities?: T[]) {
    super();
    makeObservable(this);

    if (entities) {
      this.fromEntities(entities);
    }
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

  @observable.shallow private nodes: Record<TreeNode['id'], TreeNode<T>> = {};

  @computed
  get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded);
  }

  get selectedNodes() {
    return Object.values(this.nodes).filter((node) => node.isSelected);
  }

  private get invalidTargets() {
    return Object.values(this.nodes).filter((node) => !node.isValidTarget);
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
      pull(node.parent!.children, node);
    }

    for (const id of ids) {
      delete this.nodes[id];
    }
  }

  protected abstract entityToNode(entity: T): Partial<Pick<TreeNode, 'isLeaf' | 'title'>>;

  @action
  private addNode(entity: T) {
    if (entity.id === this.root.id) {
      throw new Error('invalid id');
    }

    const parent = this.getNode(entity.parentId);
    const node: TreeNode<T> = observable({
      id: entity.id,
      parent,
      entity,
      ...getDefaultNode<T>(),
      ...this.entityToNode(entity),
    });

    parent.isLeaf = false;
    parent.children.push(node);
    this.nodes[entity.id] = node;
  }

  @action
  updateChildren(parentId: TreeNode['id'] | null, entities: T[]) {
    const parentNode = this.getNode(parentId);
    const toRemoveIds = map(
      differenceWith(parentNode.children, entities, (a, b) => a.id === b.id),
      'id',
    );

    this.removeNodes(toRemoveIds);

    if (entities.length === 0) {
      parentNode.children = [];
    }

    this.updateTree(entities);
  }

  @action
  updateTree(entity: T | T[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      const node = this.getNode(entity.id, true);

      if (!node) {
        this.addNode(entity);
        continue;
      }

      Object.assign(node, this.entityToNode(entity));

      if (node.parent!.id === (entity.parentId || ROOT_NODE_ID)) {
        continue;
      }

      // reset parent-child relationship
      const newParent = this.getNode(entity.parentId);

      pull(node.parent!.children, node);
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

    return parent!.children.filter(({ id: _id }) => _id !== id);
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

  private getDescendants(id: TreeNode['id']): TreeNode<T>[] {
    const { children } = this.getNode(id);

    return [...children, ...children.flatMap((child) => this.getDescendants(child.id))];
  }

  @action.bound
  collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
  }

  @action
  disableInvalidParents(ids: TreeNode['id'][]) {
    this.resetTargets();

    for (const id of ids) {
      const node = this.getNode(id);

      node.isValidTarget = false;
      node.parent!.isValidTarget = false;

      for (const descendant of this.getDescendants(id)) {
        descendant.isValidTarget = false;
      }
    }
  }

  @action
  resetTargets() {
    for (const node of this.invalidTargets) {
      node.isValidTarget = true;
    }
  }

  private fromEntities(entities: T[]) {
    const descants: T[] = [];
    const roots: T[] = [];

    for (const entity of entities) {
      (entity.parentId ? descants : roots).push(entity);
    }

    const childrenGroup = groupBy(descants, 'parentId');
    const createChildrenNodes = (entities: T[]) => {
      for (const entity of entities) {
        this.addNode(entity);
        const children = childrenGroup[entity.id];
        children && createChildrenNodes(children);
      }
    };

    createChildrenNodes(roots);
  }
}
