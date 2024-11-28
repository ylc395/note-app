import { container } from '#domain/shared/infra/singletons';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { EntityTypes } from '#domain/client/shared/model/entity';

import { eventBus, EventNames } from '../model/material/eventBus';
import MoveBehavior from '../model/entity/MoveBehavior';
import type { MoveEvent } from '../model/entity/events';
import CreationProcess from '../model/material/CreationProcess';

export default class MaterialService {
  constructor() {
    this.moveBehavior.events.on(MoveBehavior.eventNames.Move, this.moveMaterials);
  }

  private readonly remote = container.resolve(rpcToken);

  private readonly moveBehavior = container.resolve(MoveBehavior);

  public readonly creation = new CreationProcess();

  private readonly moveMaterials = async ({ items, target }: MoveEvent) => {
    const materialIds = items
      .filter(({ entityType }) => entityType === EntityTypes.Material)
      .map(({ entityId }) => entityId);

    if (materialIds.length === 0) {
      return;
    }

    await this.remote.material.batchUpdate.mutate([materialIds, { parentId: target.entityId }]);

    for (const material of items) {
      eventBus.emit(EventNames.Updated, {
        trigger: this.moveBehavior,
        id: material.entityId,
        payload: { parentId: target.entityId },
      });
    }
  };
}
