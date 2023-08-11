import { nativeEnum, object, string } from 'zod';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
}

export interface EntityLocator {
  type: EntityTypes;
  id: EntityId;
  mimeType?: string;
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

export const entityLocatorSchema = object({
  id: string(),
  type: nativeEnum(EntityTypes),
});
