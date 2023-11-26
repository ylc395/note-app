import type { ContentEntityLocator } from 'model/content';
import type { EntityId, HierarchyEntityLocator } from 'model/entity';

export interface EntityRepository {
  findDescendantIds(
    entities: HierarchyEntityLocator[],
  ): Promise<Record<HierarchyEntityLocator['entityType'], Record<EntityId, string[]>>>;
  findAllBody: (entities: ContentEntityLocator[]) => AsyncGenerator<{ content: string } & ContentEntityLocator>;
}
