import type { RecyclableRecord } from 'interface/Recyclables';
import type { EntityTypes } from 'interface/Entity';

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: string[]) => Promise<RecyclableRecord[]>;
}
