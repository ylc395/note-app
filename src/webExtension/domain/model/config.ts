import type { EntityId, EntityTypes } from 'shared/interface/entity';

export interface Config {
  targetEntityType: EntityTypes;
  targetEntityId: Record<EntityTypes, EntityId | null>;
}

export const CONFIG_KEY = 'config';
