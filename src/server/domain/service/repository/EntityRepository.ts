import type { EntityId, Entity } from '@domain/model/entity.js';

export interface EntityRepository {
  findDescendantIds: (ids: EntityId[]) => Promise<Record<EntityId, EntityId[]>>;
  findOneById: (id: EntityId) => Promise<Entity | null>;
  findChildrenIds: (ids: EntityId[], options?: { isAvailableOnly: boolean }) => Promise<Record<EntityId, EntityId[]>>;
  findAncestorIds: (ids: EntityId[]) => Promise<Record<EntityId, EntityId[]>>;
  findAllBody: (ids: EntityId[]) => AsyncGenerator<{ content: string; id: EntityId }>;
  findAllAvailable: (ids: EntityId[]) => Promise<EntityId[]>;
}
