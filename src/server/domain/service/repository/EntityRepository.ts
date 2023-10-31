import type { ContentEntityLocator } from 'model/content';
import type { EntityId, HierarchyEntityLocator, HierarchyEntityTypes } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(
    entities: HierarchyEntityLocator[],
  ): Promise<Record<HierarchyEntityTypes, Record<EntityId, string[]>>>;
  findAllBody: (entities: ContentEntityLocator[]) => AsyncGenerator<{ content: string } & ContentEntityLocator>;
  findBody: (entity: ContentEntityLocator) => Promise<string | null>;
}
