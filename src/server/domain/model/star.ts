import type { EntityId, EntityLocator } from 'model/entity';
import type { StarEntityTypes } from 'shard/model/star';

export * from 'shard/model/star';

export interface StarRecord extends EntityLocator<StarEntityTypes> {
  id: EntityId;
}
