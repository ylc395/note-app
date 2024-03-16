import type { EntityId, Entity, EntityTypes } from '@domain/model/entity.js';

export interface EntityRepository {
  findDescendantIds: (ids: EntityId[]) => Promise<Record<EntityId, EntityId[]>>;
  findOneById: (id: EntityId) => Promise<Required<Entity> | null>;
  findChildrenIds: (ids: EntityId[], options?: { isAvailableOnly: boolean }) => Promise<Record<EntityId, EntityId[]>>;
  findAncestors: (ids: EntityId[]) => Promise<Record<EntityId, Entity[]>>;
  findAllContents: (ids: EntityId[]) => AsyncGenerator<{ content: string; id: EntityId }>;
  findAllAvailable: (ids: EntityId[], params?: { types?: EntityTypes[] }) => Promise<Entity[]>;
}
