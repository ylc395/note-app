import type { EntityLocator as CommonEntityLocator, EntityId, WithId } from '@domain/shared/model/entity';

export * from '@domain/shared/model/entity';

export interface EntityLocator extends CommonEntityLocator {
  mimeType?: string;
}

export type UpdateEvent<T extends { id: EntityId }> = {
  trigger: unknown;
  entity: WithId<T>;
};
