import { nativeEnum, object, string, infer as Infer } from 'zod';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  MaterialAnnotation,
  File,
}

export type HierarchyEntityTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

export type MainEntityTypes = HierarchyEntityTypes;

export type EntityId = string;

export type EntityParentId = EntityId | null;

export interface HierarchyEntity {
  id: EntityId;
  parentId: EntityParentId;
}

export interface HierarchyEntityLocator extends EntityLocator {
  entityType: HierarchyEntityTypes;
}

export const entityLocatorSchema = object({
  entityId: string(),
  entityType: nativeEnum(EntityTypes),
});

export type EntityLocator<T = EntityTypes> = Infer<typeof entityLocatorSchema> & { entityType: T };

export interface EntityWithTitle<T = EntityTypes> extends EntityLocator<T> {
  title: string;
}
