import type { ContentEntityLocator } from 'model/content';
import type { EntityId, EntityLocator, HierarchyEntityLocator, HierarchyEntityTypes } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(
    entities: HierarchyEntityLocator[],
  ): Promise<Record<HierarchyEntityTypes, Record<EntityId, string[]>>>;
  findAllBody: (entities: EntityLocator[]) => AsyncGenerator<{ content: string } & ContentEntityLocator>;
  findBody: (entity: EntityLocator) => Promise<string | null>;
}
