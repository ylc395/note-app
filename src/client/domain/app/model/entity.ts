import type { EntityLocator as CommonEntityLocator, EntityId } from '@shared/domain/model/entity';

export * from '@shared/domain/model/entity';

interface Entity {
  id: EntityId;
}

export type WithId<T extends Entity> = Partial<T> & Entity;

export interface EntityLocator extends CommonEntityLocator {
  mimeType?: string;
}
