import type { RecyclableRecord, RecycleReason } from '@domain/server/model/recyclables.js';
import type { EntityId } from '@domain/shared/model/entity.js';

export interface RecyclablesRepository {
  findAll: (params?: { entityIds?: EntityId[]; reason?: RecycleReason }) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findOneByEntityId: (entityId: EntityId) => Promise<RecyclableRecord | null>;
  batchCreate: (entities: RecyclableRecord[]) => Promise<RecyclableRecord[]>;
  remove: (entityId: EntityId) => Promise<boolean>;
}
