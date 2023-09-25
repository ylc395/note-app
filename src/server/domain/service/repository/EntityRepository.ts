import type { EntityId, EntityLocator, EntityTypes } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(type: EntityTypes, ids: EntityId[]): Promise<EntityId[]>;
  findAllBody: (entities: EntityLocator[]) => AsyncGenerator<{ content: string } & EntityLocator>;
}
