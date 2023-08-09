import type { EntityLocator } from 'interface/entity';

export interface EntityRepository {
  findAllDescants(entities: EntityLocator[]): Promise<EntityLocator[]>;
}
