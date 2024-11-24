import type { EntityId, EntityParentId, EntityTypes } from '#domain/shared/model/entity';

export * from '#domain/shared/model/entity';

export interface EntityLocator {
  entityId: EntityId;
  entityType: EntityTypes;
  mimeType?: string;
}

export interface HierarchyEntity {
  id: EntityId;
  parentId: EntityParentId;
  childrenCount: number;
}

export type UpdatedEvent<T> = {
  id: EntityId;
  payload: T;
  trigger: unknown;
};
