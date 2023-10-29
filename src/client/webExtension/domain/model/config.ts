import type { EntityParentId, MainEntityTypes } from 'model/entity';

export interface Config {
  targetEntityType: MainEntityTypes;
  targetEntityId: Record<MainEntityTypes, EntityParentId>;
}

export const CONFIG_KEY = 'config';
