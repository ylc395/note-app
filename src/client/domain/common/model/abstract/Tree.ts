import { observable, action, computed, makeObservable } from 'mobx';
import assert from 'assert';
import { pull, pickBy } from 'lodash-es';
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
  private get expandedNodes() {
    return Object.values(this.nodes).filter((node) => node.isExpanded);
  }

  @computed
  public get hasExpandedNode() {
    return this.expandedNodes.length > 0;
  }

  @computed
  // root node included
  public get selectedNodes() {
    return this.allNodes.filter((node) => node.isSelected);
  }

  protected abstract queryFragments(id: TreeNode<T>['id']): Promise<T[]>;

  public async reveal(id: TreeNode<T>['id'] | null, expand?: true) {
    if (id && !this.getNode(id, true)) {
      const nodes = await this.queryFragments(id);
      this.updateTree(nodes);
    }

    let node = this.getNode(id).parent;

    while (node && node !== this.root) {
      node.isExpanded = true;
      node = node.parent;
    }

    if (expand && id) {
      this.toggleExpand(id, true);
    }
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
  public removeNodes(ids: TreeNode<T>['id'][], isChild = false) {
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

  public abstract entityToNode(
    entity: T | null,
  ): Partial<Pick<TreeNode<T>, 'isLeaf' | 'title' | 'isDisabled' | 'icon'>>;

  @action
  private addNode(entity: T) {
    assert(entity.id !== this.root.id, 'invalid id');
    const parent = this.getNode(entity.parentId, true);

    if (!parent) {
      return;
    }

    const node = new TreeNode(this, entity);

    this.nodes[entity.id] = node;
    parent.isLeaf = false;
    parent.children.push(node);
    Object.assign(node, this.entityToNode(entity));

    return node;
  }

  @action
  public updateTree(entity: Partial<T> | Partial<T>[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      assert(entity.id);
      const node = this.getNode(entity.id, true);

      if (node) {
        assert(node.entity);
        this.updateNode({
          ...node.entity,
          ...pickBy(entity, (_, key) => key in node.entity!),
        });
      } else {
        this.addNode(entity as T);
      }
    }
  }

  @action
  private updateNode(entity: T | T[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      const node = this.getNode(entity.id);

      assert(node.entity && node.parent);
      node.entity = entity;
      Object.assign(node, this.entityToNode(node.entity));

      if (node.parent.id !== (entity.parentId || this.root.id)) {
        // reset parent-child relationship
        pull(node.parent.children, node);

        if (node.parent.children.length === 0) {
          node.parent.isLeaf = true;
          node.parent.isExpanded = false;
        }

        const newParent = this.getNode(entity.parentId, true);

        if (newParent) {
          newParent.children.push(node);
          newParent.isLeaf = false;
          node.parent = newParent;
        }
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
  public toggleSelect(id: TreeNode<T>['id'], options?: { isMultiple?: boolean; value?: boolean }) {
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

    node.isSelected = !oldValue;
  }

  @action
  public setSelected(ids: TreeNode<T>['id'][]) {
    for (const selected of this.selectedNodes) {
      selected.isSelected = false;
    }

    for (const id of ids) {
      this.toggleSelect(id, { isMultiple: true });
    }
  }

  @action.bound
  public collapseAll() {
    for (const node of this.expandedNodes) {
      node.isExpanded = false;
    }
  }
}
