import type { EntityParentId, EntityTypes } from 'model/entity';

export interface Config {
  targetEntityType: EntityTypes;
  targetEntityId: Record<EntityTypes, EntityParentId>;
}

export const CONFIG_KEY = 'config';
