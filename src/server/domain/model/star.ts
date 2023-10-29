import type { EntityId, EntityLocator } from 'model/entity';
import type { StarEntityTypes } from 'shared/model/star';

export * from 'shared/model/star';

export interface StarRecord extends EntityLocator<StarEntityTypes> {
  id: EntityId;
}
