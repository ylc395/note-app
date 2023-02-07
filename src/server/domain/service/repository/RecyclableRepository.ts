import type { RecycleRecord } from 'interface/Recyclables';
import type { RecyclablesTypes } from 'service/RecyclableService';

export interface RecyclablesRepository {
  put: (type: RecyclablesTypes, ids: string[]) => Promise<RecycleRecord>;
}
