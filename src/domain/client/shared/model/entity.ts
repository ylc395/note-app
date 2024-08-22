import type { EntityLocator as CommonEntityLocator, EntityId } from '@domain/shared/model/entity';

export * from '@domain/shared/model/entity';

export type WithId<T extends { id: EntityId }> = Partial<T> & { id: EntityId };

export interface EntityLocator extends CommonEntityLocator {
  mimeType?: string;
}

export type UpdateEvent<T extends { id: EntityId }> = {
  trigger: unknown;
  entity: WithId<T>;
};
