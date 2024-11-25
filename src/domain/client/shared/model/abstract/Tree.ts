import { observable, action, computed } from 'mobx';
import assert from 'assert';

import TreeNode, { type TreeNodeOptions, type TreeNodeView } from './TreeNode';
import type { EntityId, EntityLocator, EntityParentId, EntityPath, HierarchyEntity } from '../entity';
import type { MaybeArray } from '#utils/collection';
import { differenceWith, intersection } from 'lodash-es';

export type TreeOptions<T extends HierarchyEntity> = Pick<
  TreeNodeOptions<T>,
  'isDisabled' | 'onSelect' | 'sort' | 'onError'
>;

export default abstract class Tree<T extends HierarchyEntity = HierarchyEntity> {
  constructor(private readonly options?: TreeOptions<T>) {
    this.root = this.createOrReplaceNode();
  }

  public readonly root: TreeNode<T>;

  protected abstract queryPath(id: EntityId): Promise<EntityPath>;

  protected abstract queryChildren(id: EntityParentId | EntityId[], signal?: AbortController['signal']): Promise<T[]>;

  protected abstract toEntityLocator(entity: T): EntityLocator;

  protected abstract nodeToView(entity: T | null): TreeNodeView;

  @observable.shallow private accessor nodesMap: Record<TreeNode<T>['id'], TreeNode<T>> = {};

  @computed
  public get selectedNodes() {
    return Object.values(this.nodesMap).filter((node) => node.isSelected);
  }

  // 不包括根节点(根节点总是展开的，返回它意义不大)
  @computed
  public get expandedNodes() {
    return Object.values(this.nodesMap).filter((node) => node.isExpanded && node !== this.root);
  }

  public getNode(id: TreeNode<T>['id'] | null): TreeNode<T>;
  public getNode(id: TreeNode<T>['id'] | null, safe: true): TreeNode<T> | undefined;
  public getNode(id: TreeNode<T>['id'] | null, safe?: true) {
    if (id === this.root.id || !id) {
      return this.root;
    }

    const node = this.nodesMap[id];

    if (!node && !safe) {
      assert.fail(`no node for id ${id}`);
    }

    return node;
  }

  @action
  private addNode(node: TreeNode<T>) {
    this.nodesMap[node.id] = node;
  }

  @action
  private removeNode(node: TreeNode<T>) {
    assert(this.getNode(node.id, true), 'can not remove node');

    node.remove();
    delete this.nodesMap[node.id];
  }

  private createOrReplaceNode(options?: { entity: T; parent: TreeNode<T> }) {
    const id = options?.entity.id ?? null;
    const node = this.getNode(id, true);

    if (node) {
      node.remove();
    }

    const newNode = new TreeNode(
      {
        ...this.options,
        queryChildren: this.queryChildren.bind(this, id),
        toEntityLocator: this.toEntityLocator.bind(this),
        onNodeCreated: this.addNode.bind(this),
        toView: this.nodeToView.bind(this),
      },
      options,
    );
    this.addNode(newNode);

    return newNode;
  }

  @action
  public addOrReplace(entities: MaybeArray<T>) {
    for (const entity of Array.isArray(entities) ? entities : [entities]) {
      const parentNode = this.getNode(entity.parentId, true);

      if (parentNode) {
        this.createOrReplaceNode({ entity, parent: parentNode });
      }
    }
  }

  @action.bound
  public update(entity: MaybeArray<Partial<T> & { id: EntityId }>) {
    for (const patch of Array.isArray(entity) ? entity : [entity]) {
      const node = this.getNode(patch.id, true);

      if (!node) {
        continue;
      }

      const oldParent = node.parent;
      assert(oldParent, 'can not update root node');

      if (typeof patch.parentId !== 'undefined' && patch.parentId === (oldParent.isRoot ? null : oldParent.id)) {
        const newParent = this.getNode(patch.parentId, true);

        if (newParent) {
          newParent.addChild(node);
        } else {
          this.removeNode(node);
        }
      }

      node.update(patch);
    }
  }

  @action
  public setSelected(ids: MaybeArray<TreeNode<T>['id']>) {
    for (const selected of this.selectedNodes) {
      selected.toggleSelect(false);
    }

    for (const id of Array.isArray(ids) ? ids : [ids]) {
      this.getNode(id, true)?.toggleSelect(true);
    }
  }

  // 展开任意个指定节点。任意一个节点必须跟随其祖先节点传入，否则无法展开
  public async expand(nodeIds: TreeNode<T>['id'][]) {
    const unexpandedNodeIds = differenceWith(nodeIds, this.expandedNodes, (id, node) => id === node.id);
    const children = unexpandedNodeIds.length > 0 ? await this.queryChildren(unexpandedNodeIds) : [];
    const childrenMap = Object.groupBy(children, ({ parentId }) => parentId!);
    const allNodeIds = Object.values(this.nodesMap).map(({ id }) => id);

    // 取出已在树中的节点
    const topoSorted = intersection(nodeIds, allNodeIds).flatMap((id) => childrenMap[id] || []);

    // 进行拓扑排序
    for (let i = 0; i < topoSorted.length; i++) {
      topoSorted.push(...(childrenMap[topoSorted[i]!.id] || []));
    }

    this.addOrReplace(topoSorted);

    for (const nodeId of nodeIds) {
      const node = this.getNode(nodeId, true);

      if (node) {
        node.toggleExpand(true, false);
      }
    }
  }

  public async reveal(id: T['id'], options?: { select?: boolean }) {
    const nodeToReveal = this.getNode(id, true);
    const ancestors = nodeToReveal ? nodeToReveal.ancestors : await this.queryPath(id);
    const ids = ancestors.map(({ id }) => id);

    await this.expand(ids);

    if (options?.select) {
      this.setSelected([id]);
    }
  }
}
