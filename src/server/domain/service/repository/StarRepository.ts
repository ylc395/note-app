import type { StarRecord } from 'interface/star';
import type { EntityTypes, EntityId } from 'interface/entity';

export interface StarQuery {
  entityType: EntityTypes;
  entityId: EntityId | EntityId[];
}

export interface StarRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<StarRecord[]>;
  findAll: (query?: StarQuery) => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
}
