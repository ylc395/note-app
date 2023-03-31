import type { RecyclableRecord } from 'interface/recyclables';
import type { EntityTypes, EntityId } from 'interface/entity';

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<RecyclableRecord[]>;
}
