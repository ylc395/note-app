import assert from 'assert';
import { action, observable, makeObservable } from 'mobx';
import { first } from 'lodash-es';

import type { EntityId, EntityParentId, HierarchyEntity } from '@shared/domain/model/entity';
import type Explorer from '@domain/app/model/abstract/Explorer';
import Tree from '@domain/common/model/abstract/Tree';

export default class MoveBehavior<T extends HierarchyEntity = HierarchyEntity> {
  constructor(
    private readonly options: {
      explorer: Explorer;
      itemToIds: (items: unknown) => EntityId[] | undefined;
      onMove: (parentId: EntityParentId, ids: EntityId[]) => Promise<void>;
    },
  ) {
    makeObservable(this);
  }

  private async move(targetId: EntityParentId, itemIds: EntityId[]) {
    const { explorer, onMove } = this.options;

    await onMove(targetId, itemIds);
    explorer.tree.updateTree(itemIds.map((id) => ({ id, parentId: targetId })));

    if (targetId) {
      await explorer.reveal(targetId, { expand: true });
    }

    explorer.tree.setSelected(itemIds);
  }

  public readonly moveByTargetTree = async () => {
    assert(this.targetTree);

    const targetId = first(this.targetTree.getSelectedNodeIds(true));
    assert(targetId === null || typeof targetId === 'string');

    const itemsIds = this.options.explorer.tree.getSelectedNodeIds();
    await this.move(targetId, itemsIds);
    this.stopSelectingTarget();
  };

  public readonly moveByItems = async (targetId: EntityParentId, items: unknown) => {
    const ids = this.options.itemToIds(items);
    assert(ids);
    await this.move(targetId, ids);
  };

  @observable
  public targetTree?: Tree;

  @action.bound
  public selectTarget() {
    this.targetTree = this.createTargetTree();
  }

  @action.bound
  public stopSelectingTarget() {
    this.targetTree = undefined;
  }

  private isNodeDisabled(entity: T | null, tree: Tree) {
    const movingNodes = this.options.explorer.tree.selectedNodes;
    const parentIds = movingNodes.map(({ entity }) => entity!.parentId);

    if (!entity) {
      return parentIds.includes(null);
    }

    const ids = movingNodes.map(({ id }) => id);

    if ([...parentIds, ...ids].includes(entity.id)) {
      return true;
    }

    return tree.getNode(entity.parentId).ancestors.some((node) => node.isDisabled);
  }

  private createTargetTree() {
    let targetTree: Tree | undefined = undefined;
    const { tree } = this.options.explorer;
    const entityToNode = (entity: T | null) => {
      assert(targetTree);
      return { isDisabled: this.isNodeDisabled(entity, targetTree) };
    };

    targetTree = new (tree.constructor as { new (...args: ConstructorParameters<typeof Tree<T>>): Tree<T> })({
      entityToNode,
    });
    targetTree.root.loadChildren();

    return targetTree;
  }
}
