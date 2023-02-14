import type { RecyclableRecord } from 'interface/Recyclables';
import type { EntityTypes, EntityId } from 'interface/Entity';

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<RecyclableRecord[]>;
}
