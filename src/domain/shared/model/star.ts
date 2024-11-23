import type { Entity, EntityId } from './entity.js';

export interface Star {
  entityId: EntityId;
  createdAt: number;
}

export type StarVO = Pick<Star, 'createdAt'> & {
  entity: Entity;
};

/**
 * @api
 */
export interface StarDTO {
  entityId: EntityId;
}
