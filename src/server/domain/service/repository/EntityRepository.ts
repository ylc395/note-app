import type { EntityId, EntityTypes } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(type: EntityTypes, ids: EntityId[]): Promise<EntityId[]>;
}
