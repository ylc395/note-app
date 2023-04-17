import { string } from 'zod';
import invert from 'lodash/invert';
import mapValues from 'lodash/mapValues';

export enum EntityTypes {
  Note = 1,
  Memo,
}

export const entityTypesToString: Record<EntityTypes, string> = {
  [EntityTypes.Note]: 'notes',
  [EntityTypes.Memo]: 'memos',
};

export const stringToEntityTypes: Record<string, EntityTypes> = mapValues(invert(entityTypesToString), Number);

export type EntityId = string;

export const entityId = string;

export type EntityLocator = {
  type: EntityTypes;
  id: EntityId;
};
