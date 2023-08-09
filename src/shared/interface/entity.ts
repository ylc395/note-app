import { nativeEnum, object, string } from 'zod';

export enum EntityTypes {
  Note = 1,
  Memo,
  Material,
}

export type EntityId = string;
export type EntityParentId = EntityId | null;

export const entityId = string;

export const entityLocatorSchema = object({
  id: entityId(),
  type: nativeEnum(EntityTypes),
});

export type EntityLocator = {
  type: EntityTypes;
  id: EntityId;
  mimeType?: string;
};
