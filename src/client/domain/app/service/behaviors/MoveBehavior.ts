import { container } from 'tsyringe';
import assert from 'assert';
import { wrap } from 'lodash-es';

import type { EntityId, EntityParentId, HierarchyEntity } from '@shared/domain/model/entity';
import type { PromptToken } from '@shared/domain/infra/ui';
import { token as UIToken } from '@shared/domain/infra/ui';
import type Tree from '@domain/common/model/abstract/Tree';
import type Explorer from '../../model/abstract/Explorer';

export default class MoveBehavior<T extends HierarchyEntity> {
  private readonly ui = container.resolve(UIToken);
  constructor(
    private readonly options: {
      explorer: Explorer;
      promptToken: PromptToken<EntityParentId>;
      itemsToIds: (items: unknown) => EntityId[] | undefined;
      onMove: (parentId: EntityParentId, ids: EntityId[]) => Promise<void>;
    },
  ) {}

  private async move(targetId: EntityParentId, itemIds: EntityId[]) {
    const { explorer, onMove } = this.options;
    await onMove(targetId, itemIds);

    explorer.tree.updateTree(itemIds.map((id) => ({ id, parentId: targetId })));

    if (targetId) {
      await explorer.reveal(targetId, { expand: true });
    }

    explorer.tree.setSelected(itemIds);
  }

  public async byUserInput() {
    const targetId = await this.ui.prompt(this.options.promptToken);

    if (targetId === undefined) {
      return;
    }

    await this.move(targetId, this.options.explorer.tree.getSelectedNodeIds());
  }

  public readonly getTargetTree = () => {
    const tree = this.options.explorer.tree;
    function isDisable(this: Tree, entity: T | null) {
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
    Object.assign(targetTree.root, targetTree.entityToNode?.(targetTree.root.entity));

    targetTree.entityToNode = wrap(targetTree.entityToNode, function (this: Tree<T>, func, entity) {
      return {
        ...func?.(entity),
        isDisabled: isDisable.call(this, entity),
      };
    });

    return targetTree;
  };

  public readonly byItems = async (targetId: EntityParentId, items: unknown) => {
    const ids = this.options.itemsToIds(items);
    assert(ids);
    await this.move(targetId, ids);
  };
}
