import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityId } from '#domain/shared/model/entity';
import EventBus from '../model/star/EventBus';
import { createQuery } from 'mobx-tanstack-query/preset';

export default class StarService {
  private readonly remote = container.resolve(rpcToken);

  private readonly eventBus = container.resolve(EventBus);

  public readonly star = async (entityId: EntityId) => {
    await this.remote.star.create.mutate({ entityId });
    this.eventBus.emit(EventBus.eventNames.Changed, { entityId, isStar: true });
  };

  public readonly unstar = async (entityId: EntityId) => {
    await this.remote.star.remove.mutate(entityId);
    this.eventBus.emit(EventBus.eventNames.Changed, { entityId, isStar: false });
  };

  public readonly starList = createQuery(() => this.remote.star.query.query(), {
    queryKey: ['stars'],
  });
}
