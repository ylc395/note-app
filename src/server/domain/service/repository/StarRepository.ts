import type { StarRecord } from 'interface/Star';
import type { EntityTypes } from 'interface/Entity';

export interface StarQuery {
  entityType: EntityTypes;
  entityId: string | string[];
}

export interface StarRepository {
  put: (type: EntityTypes, ids: string[]) => Promise<StarRecord[]>;
  findAll: (query?: StarQuery) => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
}
