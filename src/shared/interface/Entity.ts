import { string } from 'zod';
import invert from 'lodash/invert';
import mapValues from 'lodash/mapValues';

export enum EntityTypes {
  Note = 1,
}

export const entityTypesToString: Record<EntityTypes, string> = {
  [EntityTypes.Note]: 'notes',
};

export const stringToEntityTypes: Record<string, EntityTypes> = mapValues(invert(entityTypesToString), Number);

export type EntityId = string;

export const entityId = string;
