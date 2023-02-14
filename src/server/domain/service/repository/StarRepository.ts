import type { StarRecord } from 'interface/Star';
import type { EntityTypes, EntityId } from 'interface/Entity';

export interface StarQuery {
  entityType: EntityTypes;
  entityId: EntityId | EntityId[];
}

export interface StarRepository {
  put: (type: EntityTypes, ids: EntityId[]) => Promise<StarRecord[]>;
  findAll: (query?: StarQuery) => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
}
