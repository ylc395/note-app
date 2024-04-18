import type { EntityLocator as CommonEntityLocator, EntityId, WithId } from '@shared/domain/model/entity';

export * from '@shared/domain/model/entity';

export interface EntityLocator extends CommonEntityLocator {
  mimeType?: string;
}

export type UpdateEvent<T extends { id: EntityId }> = {
  trigger: unknown;
  entity: WithId<T>;
};
