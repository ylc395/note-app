import { array, nativeEnum, object, string, infer as Infer } from 'zod';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
}

export interface EntityRecord {
  entityType: EntityTypes;
  entityId: EntityId;
}

export type EntityId = string;
export type EntityParentId = EntityId | null;

export interface HierarchyEntity {
  id: EntityId;
  parentId: EntityParentId;
}

export interface EntityLocator {
  id: EntityId;
  type: EntityTypes;
  mimeType?: string;
}

export const entitiesLocatorSchema = object({
  type: nativeEnum(EntityTypes),
  ids: array(string()),
});

export type EntitiesLocator = Infer<typeof entitiesLocatorSchema>;
