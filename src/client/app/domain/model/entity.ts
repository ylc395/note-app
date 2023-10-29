import type { EntityLocator as Entity } from 'shared/model/entity';

export * from 'shared/model/entity';

export interface EntityLocator extends Entity {
  mimeType?: string;
}
