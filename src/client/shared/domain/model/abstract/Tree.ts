import { observable, action, computed, makeObservable } from 'mobx';
import { Emitter } from 'strict-event-emitter';
import assert from 'assert';
import pull from 'lodash/pull';
import differenceWith from 'lodash/differenceWith';
import map from 'lodash/map';
import pick from 'lodash/pick';
import get from 'lodash/get';

import type { HierarchyEntity } from '@shared/domain/model/entity';

export interface TreeNode<T = unknown> {
  readonly id: string;
  entity: T | null; // only root node has no entity;
  title: string;
  children: TreeNode<T>[];
  parent: TreeNode<T> | null; // only root node has no parent;
  isExpanded: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isLoading: boolean;
  isLeaf: boolean;
}

type TreeEvents = {
  nodeSelected: [SelectEvent];
  nodeExpanded: [TreeNode['id'] | null];
};

export type SelectEvent = { id: TreeNode['id'] | null; reason?: string; multiple?: boolean };

type EntityPatch<T> = Partial<T> & { id: HierarchyEntity['id'] };

const getDefaultNode = <T extends HierarchyEntity>() => ({
  isLeaf: true,
  isExpanded: false,
  isSelected: false,
  isDisabled: false,
  isLoading: false,
  children: [] as TreeNode<T>[],
  title: '',
});

export default abstract class Tree<T extends HierarchyEntity = HierarchyEntity> extends Emitter<TreeEvents> {
  readonly root: TreeNode<T> = observable({
    entity: null,
    parent: null,
    id: '__ROOT_ID',
    ...getDefaultNode<T>(),
    isExpanded: true,
  });

  constructor() {
    super();
    makeObservable(this);
  }

  @observable.shallow
  private nodes: Record<TreeNode['id'], TreeNode<T>> = {};

  protected get allNodes() {
    return [...Object.values(this.nodes), this.root];
  }

  @computed
  // root node not included
  get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded);
  }

  @computed
  // root node may be included
  protected get selectedNodes() {
    return [...Object.values(this.nodes), this.root].filter((node) => node.isSelected);
  }

  @computed
  get selectedNodeIds() {
    return this.selectedNodes.map((node) => (node.id === this.root.id ? null : node.id));
  }

  getSelectedId() {
    const selectedId = this.selectedNodeIds[0];
    assert(selectedId !== undefined);

    return selectedId;
  }

  getNode(id: TreeNode['id'] | null): TreeNode<T>;
  getNode(id: TreeNode['id'] | null, safe: true): TreeNode<T> | undefined;
  getNode(id: TreeNode['id'] | null, safe?: true) {
    if (id === this.root.id) {
      return this.root;
    }

    const node = id ? this.nodes[id] : this.root;

    if (!node && !safe) {
      assert.fail(`no node for id ${id}`);
    }

    return node;
  }

  hasNode(node: unknown): node is TreeNode<T> {
    if (this.root === node) {
      return true;
    }

    const id = get(node, 'id');
    const target = typeof id === 'string' && this.nodes[id];

    return Boolean(target && target === node);
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

  protected abstract entityToNode(entity: T): Partial<Pick<TreeNode, 'isLeaf' | 'title' | 'isDisabled'>>;

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

    return node;
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

      if (node) {
        this.updateNode(entity);
      } else {
        this.addNode(entity);
      }
    }
  }

  @action
  updateNode(patch: EntityPatch<T> | EntityPatch<T>[]) {
    const patches = Array.isArray(patch) ? patch : [patch];

    for (const patch of patches) {
      const node = this.getNode(patch.id, true);

      if (!node) {
        continue;
      }

      assert(node.entity);

      Object.assign(node.entity, pick(patch, Object.keys(node.entity)));
      Object.assign(node, this.entityToNode(node.entity));

      if (typeof patch.parentId === 'undefined') {
        return;
      }

      assert(node.parent);

      if (node.parent.id !== (patch.parentId || this.root.id)) {
        // reset parent-child relationship
        const newParent = this.getNode(patch.parentId);

        pull(node.parent.children, node);
        newParent.children.push(node);
        newParent.isLeaf = false;

        if (node.parent.children.length === 0) {
          node.parent.isLeaf = true;
        }

        node.parent = newParent;
      }
    }
  }

  @action
  toggleExpand(id: TreeNode['id'], value?: boolean) {
    const node = this.getNode(id);

    assert(!node.isLeaf, 'can not expand leaf');

    let toggled: boolean;

    if (typeof value === 'boolean') {
      toggled = node.isExpanded !== value;
      node.isExpanded = value;
    } else {
      toggled = true;
      node.isExpanded = !node.isExpanded;
    }

    if (node.isExpanded && toggled) {
      this.emit('nodeExpanded', node.id === this.root.id ? null : node.id);
    }
  }

  @action
  toggleSelect(id: TreeNode['id'], options?: Pick<SelectEvent, 'multiple' | 'reason'>) {
    const node = this.getNode(id);

    if (node.isDisabled) {
      return;
    }

    if (!options?.multiple) {
      for (const selected of this.selectedNodes) {
        selected.isSelected = false;
      }
    }

    node.isSelected = !node.isSelected;

    if (node.isSelected) {
      this.emit('nodeSelected', { id: node.id, ...options });
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

  protected getDescendants(id: TreeNode['id'] | null): TreeNode<T>[] {
    const { children } = this.getNode(id);

    return [...children, ...children.flatMap((child) => this.getDescendants(child.id))];
  }

  @action.bound
  collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
  }

  resetDisabled() {
    for (const node of this.allNodes) {
      node.isDisabled = false;
    }
  }
}
