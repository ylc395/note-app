import type { EntityId } from '@domain/shared/model/entity.js';
import type { Star, StarQuery } from '@domain/server/model/star.js';

export interface StarRepository {
  createOne: (star: Star) => Promise<void>;
  removeOne: (entityId: EntityId) => Promise<void>;
  findAll: (query?: StarQuery) => Promise<Star[]>;
  findOneByEntityId: (entityId: EntityId) => Promise<Star | null>;
}
