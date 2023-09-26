import { array, nativeEnum, object, string, infer as Infer } from 'zod';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  MaterialAnnotation,
}

export type EntityId = string;

export type EntityParentId = EntityId | null;

export interface HierarchyEntity {
  id: EntityId;
  parentId: EntityParentId;
}

export const entityLocatorSchema = object({
  entityId: string(),
  entityType: nativeEnum(EntityTypes),
  mimeType: string().optional(),
});

export type EntityLocator = Infer<typeof entityLocatorSchema>;

export const entitiesLocatorSchema = object({
  entityType: nativeEnum(EntityTypes),
  entityIds: array(string()),
});

export type EntitiesLocator = Infer<typeof entitiesLocatorSchema>;
