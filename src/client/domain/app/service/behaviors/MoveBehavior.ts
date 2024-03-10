import { container } from 'tsyringe';
import assert from 'assert';

import type { EntityId, EntityParentId, HierarchyEntity } from '@shared/domain/model/entity';
import type { PromptToken } from '@shared/domain/infra/ui';
import { token as UIToken } from '@shared/domain/infra/ui';
import NoteTree from '@domain/common/model/note/Tree';
import MaterialTree from '@domain/common/model/material/Tree';
import type Explorer from '@domain/app/model/abstract/Explorer';
import Tree from '@domain/common/model/abstract/Tree';

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

  public readonly createTargetTree = () => {
    let targetTree: Tree | undefined;
    const { tree } = this.options.explorer;
    const entityToNode = (entity: T | null) => {
      assert(targetTree);
      return { isDisabled: this.isNodeDisabled(entity, targetTree) };
    };

    if (tree instanceof NoteTree) {
      targetTree = new NoteTree({ entityToNode });
    }

    if (tree instanceof MaterialTree) {
      targetTree = new MaterialTree({ entityToNode });
    }

    assert(targetTree);
    targetTree.root.loadChildren();

    return targetTree;
  };

  public readonly byItems = async (targetId: EntityParentId, items: unknown) => {
    const ids = this.options.itemsToIds(items);
    assert(ids);
    await this.move(targetId, ids);
  };
}
