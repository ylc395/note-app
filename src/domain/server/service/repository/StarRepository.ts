import type { EntityId } from '@domain/shared/model/entity.js';
import type { StarRecord, StarQuery } from '@domain/server/model/star.js';

export interface StarRepository {
  createOne: (entityId: EntityId) => Promise<void>;
  removeOne: (entityId: EntityId) => Promise<void>;
  findAll: (q: StarQuery) => Promise<StarRecord[]>;
}
