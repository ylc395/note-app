import type { EntityId, Entity } from '#domain/shared/model/entity.js';

export interface EntityQuery {
  ids?: EntityId[];
  isAvailableOnly?: boolean;
  updatedSince?: number;
}

export interface EntityRepository {
  findDescendantIds(ids: EntityId): Promise<EntityId[]>;
  findDescendantIds(ids: EntityId[]): Promise<Record<EntityId, EntityId[]>>;
  findChildrenIds: (ids: EntityId[], options?: { isAvailableOnly: boolean }) => Promise<Record<EntityId, EntityId[]>>;
  findAncestors(id: EntityId): Promise<Entity[]>;
  findAncestors(ids: EntityId[]): Promise<Record<EntityId, Entity[]>>;
  findAllContents: (ids: EntityId[]) => Promise<AsyncIterableIterator<{ body: string; id: EntityId }>>;
  findAll: (query: EntityQuery) => Promise<Entity[]>;
  findOneById: (id: EntityId) => Promise<Required<Pick<Entity, 'title' | 'body'> | null>>;
}
