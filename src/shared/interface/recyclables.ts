import { object, array } from 'zod';
import { type EntityTypes, type EntityId, entityId } from './entity';

export const RecyclablesDTOSchema = object({
  ids: array(entityId()).nonempty(),
});

export type RecyclablesDTO = { ids: string[] };

export interface RecyclableRecord {
  deletedAt: number;
  entityType: EntityTypes;
  entityId: EntityId;
}
