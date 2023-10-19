import { nativeEnum, object, string, infer as Infer } from 'zod';
import pick from 'lodash/pick';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
  MaterialAnnotation,
  File,
}

export type HierarchyEntityTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

export type MainEntityTypes = EntityTypes.Note | EntityTypes.Memo | EntityTypes.Material;

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

export const hierarchyEntityLocatorSchema = entityLocatorSchema.extend({
  entityType: nativeEnum(pick(EntityTypes, ['Note', 'Memo', 'Material'] as const)),
});

export type HierarchyEntityLocator = Infer<typeof hierarchyEntityLocatorSchema>;

export type EntityLocator<T = EntityTypes> = Infer<typeof entityLocatorSchema> & { entityType: T };

export interface EntityWithTitle<T = EntityTypes> extends EntityLocator<T> {
  title: string;
}
