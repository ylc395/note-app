import type { StarRecord } from 'interface/Star';
import type { EntityTypes } from 'interface/Entity';

export interface StarRepository {
  put: (type: EntityTypes, ids: string[]) => Promise<StarRecord[]>;
  findAll: () => Promise<StarRecord[]>;
  remove: (id: StarRecord['id']) => Promise<void>;
}
