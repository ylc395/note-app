import type { EntityId } from '@domain/model/entity.js';
import type { StarRecord, StarQuery } from '@domain/model/star.js';

export interface StarRepository {
  createOne: (entityId: EntityId) => Promise<void>;
  removeOne: (entityId: EntityId) => Promise<void>;
  findAll: (q: StarQuery) => Promise<StarRecord[]>;
}
