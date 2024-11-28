import type { EntityId, EntityLocator, EntityParentId, EntityTypes } from '#domain/client/shared/model/entity';

export type UpdatedEvent<T> = {
  id: EntityId;
  payload: T;
  trigger: unknown;
};

export interface MoveTargetEvent {}

export interface MoveEvent {
  items: EntityLocator[];
  target: {
    entityType: EntityTypes;
    entityId: EntityParentId;
  };
}

export enum EventNames {
  Move = 'move',
}
