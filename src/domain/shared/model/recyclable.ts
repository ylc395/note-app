import type { Entity, EntityId, EntityPath } from './entity.js';

export interface RecyclableDTO {
  entityId: EntityId;
}

/**
 * @api
 */
export type RecyclablesDTO = RecyclableDTO[];

export interface RecyclableVO {
  entity: Entity;
  path: EntityPath;
  createdAt: number;
}
