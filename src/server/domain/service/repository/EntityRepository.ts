import type { ContentEntityLocator } from '@domain/model/content.js';
import type { EntityId, HierarchyEntityLocator } from '@domain/model/entity.js';

export interface EntityRepository {
  findDescendantIds(
    entities: HierarchyEntityLocator[],
  ): Promise<Record<HierarchyEntityLocator['entityType'], Record<EntityId, string[]>>>;
  findAllBody: (entities: ContentEntityLocator[]) => AsyncGenerator<{ content: string } & ContentEntityLocator>;
}
