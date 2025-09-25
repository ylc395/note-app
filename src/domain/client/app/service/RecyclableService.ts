import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityId, EntityTypes } from '#domain/shared/model/entity';
import EventBus from '../model/recyclable/EventBus';
import { createQuery } from 'mobx-tanstack-query/preset';
import { arrayOf, type MaybeArray } from '#utils/collection';
import type { RecyclableVO } from '#domain/shared/model/recyclable';

export default class RecyclableService {
  private readonly remote = container.resolve(rpcToken);

  private readonly eventBus = container.resolve(EventBus);

  public readonly put = async (entityId: MaybeArray<EntityId>, entityType: EntityTypes) => {
    await this.remote.recyclable.batchCreate.mutate(arrayOf(entityId).map((id) => ({ entityId: id })));

    for (const id of arrayOf(entityId)) {
      this.eventBus.emit(EventBus.eventNames.Put, { entityId: id, entityType });
    }
  };

  public readonly recover = async (record: RecyclableVO) => {
    await this.remote.recyclable.recover.mutate(record.entity.id);
    this.eventBus.emit(EventBus.eventNames.Recover, record);
  };

  public readonly list = createQuery(() => this.remote.recyclable.queryAll.query(), {
    queryKey: ['recyclables'],
  });
}
