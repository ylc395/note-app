import type { EntityParentId, MainEntityTypes } from '@domain/model/entity';

export interface Config {
  targetEntityType: MainEntityTypes;
  targetEntityId: Record<MainEntityTypes, EntityParentId>;
}

export const CONFIG_KEY = 'config';
