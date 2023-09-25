import type { infer as Infer } from 'zod';
import { entitiesLocatorSchema, type EntityLocator } from './entity';

export const RecyclablesDTOSchema = entitiesLocatorSchema;

export type RecyclablesDTO = Infer<typeof RecyclablesDTOSchema>;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableRecord extends EntityLocator {
  deletedAt: number;
  title: string;
}
