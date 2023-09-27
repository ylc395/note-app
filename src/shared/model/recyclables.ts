import type { infer as Infer } from 'zod';
import { entityLocatorSchema, type EntityLocator } from './entity';

export const RecyclablesDTOSchema = entityLocatorSchema.array();

export type RecyclablesDTO = Infer<typeof RecyclablesDTOSchema>;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableVO extends EntityLocator {
  deletedAt: number;
  title: string;
}
