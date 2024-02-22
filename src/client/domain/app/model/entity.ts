import type { EntityLocator as CommonEntityLocator, EntityId } from '@shared/domain/model/entity';

export * from '@shared/domain/model/entity';

export interface EntityLocator extends CommonEntityLocator {
  mimeType?: string;
}

export interface ActionEvent {
  id: EntityId[];
  action: string;
}

export type UpdateEvent<T = unknown> = {
  id: EntityId;
  trigger: unknown;
} & T;
