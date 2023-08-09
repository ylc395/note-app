import type { EntityLocator } from 'model/entity';

export interface EntityRepository {
  findAllDescants(entities: EntityLocator[]): Promise<EntityLocator[]>;
}
