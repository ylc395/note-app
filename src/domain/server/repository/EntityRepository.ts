import type { EntityId, Entity } from '@domain/shared/model/entity.js';

export interface EntityRepository {
  findDescendantIds(ids: EntityId): Promise<EntityId[]>;
  findDescendantIds(ids: EntityId[]): Promise<Record<EntityId, EntityId[]>>;
  findChildrenIds: (ids: EntityId[], options?: { isAvailableOnly: boolean }) => Promise<Record<EntityId, EntityId[]>>;
  findAncestors: (ids: EntityId[]) => Promise<Record<EntityId, Entity[]>>;
  findAllContents: (ids: EntityId[]) => Promise<AsyncIterableIterator<{ body: string; id: EntityId }>>;
  findAll: (ids: EntityId[], params?: { isAvailableOnly?: boolean }) => Promise<Entity[]>;
}
