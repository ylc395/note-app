import { singleton, container } from 'tsyringe';

import { token as rpcToken } from '@domain/client/common/infra/rpc';
import { EntityTypes } from '../../../common/model/entity';
import TreeNode from '@domain/client/common/model/abstract/TreeNode';
import MaterialEditor from '../../model/material/editor/MaterialEditor';
import eventBus, { Events } from '../../model/material/eventBus';
import CreationBehavior from './CreationBehavior';
import MoveBehavior, { Events as MoveEvents, type MoveEvent } from '../../model/behavior/MoveBehavior';

@singleton()
export default class MaterialService {
  private readonly remote = container.resolve(rpcToken);
  public readonly creation = new CreationBehavior();
  private readonly moveService = container.resolve(MoveBehavior);

  constructor() {
    this.moveService.on(MoveEvents.Move, this.moveMaterials);
  }

  private readonly moveMaterials = async ({ items, target }: MoveEvent) => {
    if (target.entityType !== EntityTypes.Material) {
      return;
    }

    await this.remote.material.batchUpdate.mutate([
      items.map(({ entityId }) => entityId),
      { parentId: target.entityId },
    ]);

    for (const note of items) {
      eventBus.emit(Events.Updated, {
        trigger: this.moveService,
        entity: { id: note.entityId, parentId: target.entityId },
      });
    }
  };

  public static getMaterialIds(item: unknown) {
    if (item instanceof TreeNode && item.entityLocator.entityType === EntityTypes.Material) {
      return item.tree.getSelectedNodeIds();
    }

    if (item instanceof MaterialEditor) {
      return [item.entityLocator.entityId];
    }
  }
}
