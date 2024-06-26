import type { EntityId, EntityLocator } from './entity.js';

/**
 * @api
 */
export interface StarDTO {
  entityId: EntityId;
}

/**
 * @api
 */
export interface StarVO extends EntityLocator {
  mimeType?: string;
  title: string;
  mainEntityId?: EntityId;
  icon: string | null;
}
