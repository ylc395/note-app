import { observable, action, computed, makeObservable } from 'mobx';
import assert from 'assert';
import { pull, differenceWith, map } from 'lodash-es';
import { container } from 'tsyringe';

import type { EntityParentId, EntityTypes, HierarchyEntity } from '@shared/domain/model/entity';
import { token as remoteToken } from '@domain/common/infra/rpc';
import TreeNode from './TreeNode';

export default abstract class Tree<T extends HierarchyEntity = HierarchyEntity> {
  constructor() {
    makeObservable(this);
  }

  public readonly root: TreeNode<T> = new TreeNode(this);
  public abstract readonly entityType: EntityTypes;
  protected readonly remote = container.resolve(remoteToken);
  public abstract fetchChildren(parentId: EntityParentId): Promise<T[]>;

  @observable.shallow
  private nodes: Record<TreeNode<T>['id'], TreeNode<T>> = {};

  public get allNodes() {
    return [...Object.values(this.nodes), this.root];
  }

  @computed
  // root node not included
  public get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded);
  }

  @computed
  // root node not included
  public get selectedNodes() {
    return this.allNodes.filter((node) => node.isSelected);
  }

  public getSelectedNodeIds(): string[];
  public getSelectedNodeIds(containRoot: true): (string | null)[];
  public getSelectedNodeIds(containRoot?: true) {
    return this.allNodes
      .filter((node) => (containRoot ? node.isSelected : node.isSelected && node !== this.root))
      .map((node) => (this.root === node ? null : node.id));
  }

  getNode(id: TreeNode<T>['id'] | null): TreeNode<T>;
  getNode(id: TreeNode<T>['id'] | null, safe: true): TreeNode<T> | undefined;
  getNode(id: TreeNode<T>['id'] | null, safe?: true) {
    if (id === this.root.id) {
      return this.root;
    }

    const node = id ? this.nodes[id] : this.root;

    if (!node && !safe) {
      assert.fail(`no node for id ${id}`);
    }

    return node;
  }

  @action
  removeNodes(ids: TreeNode<T>['id'][], isChild = false) {
    for (const id of ids) {
      const node = this.getNode(id);

      if (!isChild) {
        pull(node.parent!.children, node);
      }

      const childrenIds = node.children.map((node) => node.id);
      this.removeNodes(childrenIds, true);
    }

    for (const id of ids) {
      delete this.nodes[id];
    }
  }

  protected abstract entityToNode(
    entity: T | null,
  ): Partial<Pick<TreeNode<T>, 'isLeaf' | 'title' | 'isDisabled' | 'icon'>>;

  @action
  private addNode(entity: T) {
    if (entity.id === this.root.id) {
      throw new Error('invalid id');
    }

    const parent = this.getNode(entity.parentId);
    const node = new TreeNode(this, entity);

    parent.isLeaf = false;
    parent.children.push(node);
    this.nodes[entity.id] = node;
    Object.assign(node, this.entityToNode(entity));

    return node;
  }

  @action
  updateChildren(parentId: TreeNode<T>['id'] | null, entities: T[]) {
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
  updateNode(entity: T | T[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      const node = this.getNode(entity.id);

      assert(node.entity);
      assert(node.parent);

      node.entity = entity;
      Object.assign(node, this.entityToNode(node.entity));

      if (node.parent.id !== (entity.parentId || this.root.id)) {
        // reset parent-child relationship
        const newParent = this.getNode(entity.parentId);

        pull(node.parent.children, node);
        newParent.children.push(node);
        newParent.isLeaf = false;

        if (node.parent.children.length === 0) {
          node.parent.isLeaf = true;
          node.parent.isExpanded = false;
        }

        node.parent = newParent;
      }
    }
  }

  @action
  public toggleExpand(id: TreeNode<T>['id'], value?: boolean) {
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
      node.loadChildren();
    }
  }

  @action
  toggleSelect(id: TreeNode<T>['id'], options?: { isMultiple?: boolean; value?: boolean }) {
    const node = this.getNode(id);

    if (node.isDisabled) {
      return;
    }

    const oldValue = node.isSelected;

    if (oldValue === options?.value) {
      return;
    }

    if (!options?.isMultiple) {
      for (const selected of this.selectedNodes) {
        selected.isSelected = false;
      }
    }

    node.isSelected = !node.isSelected;
  }

  @action
  setSelected(ids: TreeNode<T>['id'][]) {
    for (const selected of this.selectedNodes) {
      selected.isSelected = false;
    }

    for (const id of ids) {
      this.toggleSelect(id, { isMultiple: true });
    }
  }

  @action.bound
  collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
  }
}
