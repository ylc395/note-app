import type { RecycleRecord } from 'interface/Recyclables';
import type { RecyclablesTypes } from 'service/RecyclableService';

export const token = Symbol('recyclablesRepository');

export interface RecyclablesRepository {
  put: (type: RecyclablesTypes, ids: string[]) => Promise<RecycleRecord>;
}
