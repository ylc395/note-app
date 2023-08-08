import { infer as Infer, array } from 'zod';
import { type EntityTypes, type EntityId, entityLocatorSchema } from './entity';

export const RecyclablesDTOSchema = array(entityLocatorSchema);

export type RecyclablesDTO = Infer<typeof RecyclablesDTOSchema>;

export enum RecycleReason {
  Direct = 1,
  Cascade,
}

export interface RecyclableRecord {
  deletedAt: number;
  entityType: EntityTypes;
  entityId: EntityId;
}
