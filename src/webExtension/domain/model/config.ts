import type { EntityParentId, EntityTypes } from 'interface/entity';

export interface Config {
  targetEntityType: EntityTypes;
  targetEntityId: Record<EntityTypes, EntityParentId>;
}

export const CONFIG_KEY = 'config';
