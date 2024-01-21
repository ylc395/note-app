import { wrap } from 'lodash-es';
import Tree from '@domain/common/model/abstract/Tree';
import type { HierarchyEntity } from '../entity';

export default function getTargetTree<T extends HierarchyEntity>(tree: Tree<T>) {
  function isDisable(this: Tree<T>, entity: T | null) {
    const movingNodes = tree.selectedNodes;
    const parentIds = movingNodes.map(({ entity }) => entity!.parentId);

    if (!entity) {
      return parentIds.includes(null);
    }

    const ids = movingNodes.map(({ id }) => id);

    if ([...parentIds, ...ids].includes(entity.id)) {
      return true;
    }

    return this.getNode(entity.parentId).ancestors.some((node) => node.isDisabled);
  }

  const targetTree = new (tree.constructor as { new (): Tree<T> })();
  Object.assign(targetTree.root, targetTree.entityToNode(targetTree.root.entity));

  targetTree.entityToNode = wrap(targetTree.entityToNode, function (this: Tree<T>, func, entity) {
    return {
      ...func(entity),
      isDisabled: isDisable.call(this, entity),
    };
  });

  return targetTree;
}
