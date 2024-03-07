import { observable, action, computed, makeObservable } from 'mobx';
import assert from 'assert';
import { pull, pickBy } from 'lodash-es';
import { container } from 'tsyringe';

import type { EntityTypes, HierarchyEntity } from '@shared/domain/model/entity';
import type TreeNode from './TreeNode';
import { token as remoteToken } from '@domain/common/infra/rpc';

export default abstract class Tree<T extends HierarchyEntity = HierarchyEntity> {
  constructor() {
    makeObservable(this);
  }

  public readonly root = this.createNode(null);
  public abstract readonly entityType: EntityTypes;
  public abstract entityToNode(
    entity: T | null,
  ): Partial<Pick<TreeNode<T>, 'isLeaf' | 'title' | 'isDisabled' | 'icon'>>;
  protected readonly remote = container.resolve(remoteToken);

  @observable.shallow
  private nodes: Record<TreeNode<T>['id'], TreeNode<T>> = {};

  public get allNodes() {
    return [...Object.values(this.nodes), this.root];
  }

  @computed
  // root node included
  public get selectedNodes() {
    return this.allNodes.filter((node) => node.isSelected);
  }

  protected abstract createNode(entity: T | null): TreeNode<T>;

  public getSelectedNode() {
    const node = this.selectedNodes[0];
    assert(node);

    return node;
  }

  public getSelectedNodeIds(): string[];
  public getSelectedNodeIds(containRoot: true): (string | null)[];
  public getSelectedNodeIds(containRoot?: true) {
    return this.allNodes
      .filter((node) => (containRoot ? node.isSelected : node.isSelected && node !== this.root))
      .map((node) => (this.root === node ? null : node.id));
  }

  public getNode(id: TreeNode<T>['id'] | null): TreeNode<T>;
  public getNode(id: TreeNode<T>['id'] | null, safe: true): TreeNode<T> | undefined;
  public getNode(id: TreeNode<T>['id'] | null, safe?: true) {
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
  private addNode(entity: T) {
    assert(entity.id !== this.root.id, 'invalid id');
    const parent = this.getNode(entity.parentId, true);

    if (!parent) {
      return;
    }

    const node = this.createNode(entity);

    this.nodes[entity.id] = node;
    parent.isLeaf = false;
    parent.children.push(node);
    Object.assign(node, this.entityToNode(entity));

    return node;
  }

  @action.bound
  public updateTree(entity: T | T[]) {
    const entities = Array.isArray(entity) ? entity : [entity];

    for (const entity of entities) {
      const node = this.getNode(entity.id, true);

      if (node) {
        assert(node.entity, 'can not update root entity');
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

      const oldParentId = node.parent.id || this.root.id;
      node.entity = entity;
      Object.assign(node, this.entityToNode(node.entity));

      const newParent = node.parent;

      if (node.parent.id !== oldParentId) {
        // reset parent-child relationship
        const oldParent = this.getNode(oldParentId);
        pull(oldParent.children, node);

        if (oldParent.children.length === 0) {
          oldParent.isLeaf = true;
          oldParent.isExpanded = false;
        }

        if (newParent) {
          newParent.children.push(node);
          newParent.isLeaf = false;
        }
      }
    }
  }

  @action
  public setSelected(ids: TreeNode<T>['id'][]) {
    for (const selected of this.selectedNodes) {
      selected.isSelected = false;
    }

    for (const id of ids) {
      this.getNode(id).toggleSelect({ isMultiple: true });
    }
  }
}
