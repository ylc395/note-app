import type { EntityId, EntityLocator, EntityTypes } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(entities: EntityLocator[]): Promise<Record<EntityTypes, Record<EntityId, string[]>>>;
  findAllBody: (entities: EntityLocator[]) => AsyncGenerator<{ content: string } & EntityLocator>;
  findBody: (entity: EntityLocator) => Promise<string | null>;
}
