import type { EntityId, EntityLocator } from '@domain/model/entity.js';
import type { StarEntityTypes } from '@shared/domain/model/star.js';

export * from '@shared/domain/model/star.js';

export interface StarRecord extends EntityLocator<StarEntityTypes> {
  id: EntityId;
}
