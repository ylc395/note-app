import type { EntityId } from '@domain/shared/model/entity.js';
import type { Star } from '@domain/shared/model/star.js';

export interface StarQuery {
  isAvailableOnly?: boolean;
  entityIds?: EntityId[];
}

export interface StarRepository {
  createOne: (star: Star) => Promise<void>;
  removeOne: (entityId: EntityId) => Promise<void>;
  findAll: (query?: StarQuery) => Promise<Star[]>;
  findOneByEntityId: (entityId: EntityId) => Promise<Star | null>;
}
