import type { EntityId } from '@domain/shared/model/entity.js';

export interface StarQuery {
  isAvailableOnly?: boolean;
  entityIds?: EntityId[];
}

export * from '@domain/shared/model/star.js';
