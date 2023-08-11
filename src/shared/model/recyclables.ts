import { infer as Infer, array } from 'zod';
import { entityLocatorSchema, type EntityRecord } from './entity';

export const RecyclablesDTOSchema = array(entityLocatorSchema);

export type RecyclablesDTO = Infer<typeof RecyclablesDTOSchema>;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableRecord extends EntityRecord {
  deletedAt: number;
  title: string;
}
