import { container } from 'tsyringe';
import assert from 'assert';

import type { EntityId, EntityParentId } from '@shared/domain/model/entity';
import type { PromptToken } from '@shared/domain/infra/ui';
import { token as UIToken } from '@shared/domain/infra/ui';
import type Tree from '@domain/common/model/abstract/Tree';

export default class MoveBehavior {
  private readonly ui = container.resolve(UIToken);
  constructor(
    private readonly options: {
      tree: Tree;
      promptToken: PromptToken<EntityParentId>;
      itemsToIds: (items: unknown) => EntityId[] | undefined;
      onMove: (parentId: EntityParentId, ids: EntityId[]) => Promise<void>;
    },
  ) {}

  private async move(targetId: EntityParentId, itemIds: EntityId[]) {
    const { tree, onMove } = this.options;
    await onMove(targetId, itemIds);

    tree.updateTree(itemIds.map((id) => ({ id, parentId: targetId })));
    await tree.reveal(targetId, true);
    tree.setSelected(itemIds);
  }

  public async byUserInput() {
    const targetId = await this.ui.prompt(this.options.promptToken);

    if (targetId === undefined) {
      return;
    }

    await this.move(targetId, this.options.tree.getSelectedNodeIds());
  }

  public readonly byItems = async (targetId: EntityParentId, items: unknown) => {
    const ids = this.options.itemsToIds(items);
    assert(ids);
    await this.move(targetId, ids);
  };
}
