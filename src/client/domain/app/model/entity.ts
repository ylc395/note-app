import type { EntityLocator as Entity, EntityId } from '@shared/domain/model/entity';

export * from '@shared/domain/model/entity';

export type WithId<T> = Partial<T> & { id: EntityId };

export interface EntityLocator extends Entity {
  mimeType?: string;
}
