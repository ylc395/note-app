import type { RecyclableRecord } from '#domain/server/model/recyclable.js';
import type { EntityId } from '#domain/shared/model/entity.js';

export interface Query {
  entityIds?: EntityId[];
}

export interface RecyclablesRepository {
  findAll: (params?: Query) => Promise<RecyclableRecord[]>; // not including hard deleted record
  findOneByEntityId: (entityId: EntityId) => Promise<RecyclableRecord | null>;
  batchCreate: (entities: RecyclableRecord[]) => Promise<void>;
  removeByEntityId: (entityId: EntityId) => Promise<void>;
}
