import type { EntityId, EntityLocator } from '@domain/model/entity';
import type { StarEntityTypes } from '@shared/domain/model/star';

export * from '@shared/domain/model/star';

export interface StarRecord extends EntityLocator<StarEntityTypes> {
  id: EntityId;
}
