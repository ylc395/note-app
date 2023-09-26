import type { EntityLocator as Entity } from 'shard/model/entity';

export * from 'shard/model/entity';

export interface EntityLocator extends Entity {
  mimeType?: string;
}
