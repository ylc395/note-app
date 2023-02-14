import { string } from 'zod';

export enum EntityTypes {
  Note = 1,
}

export type EntityId = string;

export const entityId = string;
