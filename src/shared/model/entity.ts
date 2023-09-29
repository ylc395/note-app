import { nativeEnum, object, string, infer as Infer } from 'zod';

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
});

export type EntityLocator = Infer<typeof entityLocatorSchema>;

export interface EntityWithTitle extends EntityLocator {
  title: string;
}
