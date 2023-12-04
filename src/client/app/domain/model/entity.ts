import type { EntityLocator as Entity } from '@shared/domain/model/entity';

export * from '@shared/domain/model/entity';

export interface EntityLocator extends Entity {
  mimeType?: string;
}
