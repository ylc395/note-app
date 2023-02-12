import type { RecyclablesRecord } from 'interface/Recyclables';
import type { EntityTypes } from 'model/Entity';

export interface RecyclablesRepository {
  put: (type: EntityTypes, ids: string[]) => Promise<RecyclablesRecord>;
}
