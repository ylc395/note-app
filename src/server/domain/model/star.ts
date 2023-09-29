import type { EntityId, EntityLocator } from 'model/entity';

export * from 'shard/model/star';

export interface StarRecord extends EntityLocator {
  id: EntityId;
}
