import { container } from 'tsyringe';

import type { EntityId, EntityParentId, HierarchyEntity } from '@shared/domain/model/entity';
import type { PromptToken } from '@shared/domain/infra/ui';
import { token as rpcToken } from '@domain/common/infra/rpc';
import { token as UIToken } from '@shared/domain/infra/ui';
import type Tree from '@domain/common/model/abstract/Tree';
import assert from 'assert';

interface Options<T extends HierarchyEntity> {
  tree: Tree<T>;
  promptToken: PromptToken<EntityParentId>;
  itemsToIds: (items: unknown) => EntityId[] | undefined;
  action: (parentId: EntityParentId, ids: EntityId[]) => Promise<T[]>;
  onMoved?: (parentId: EntityParentId, ids: EntityId[]) => void;
}

export default class MoveBehavior<T extends HierarchyEntity> {
  constructor(private readonly options: Options<T>) {}
  private readonly remote = container.resolve(rpcToken);
  private readonly ui = container.resolve(UIToken);
  private async move(targetId: EntityParentId, itemIds: EntityId[]) {
    const notes = await this.options.action(targetId, itemIds);

    this.options.tree.updateTree(notes);
    await this.options.tree.reveal(targetId, true);
    this.options.tree.setSelected(itemIds);

    this.options.onMoved?.(targetId, itemIds);
  }

  public async byUserInput() {
    assert(this.options.promptToken);

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
