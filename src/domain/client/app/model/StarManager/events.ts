import type { EntityId } from '#domain/shared/model/entity';

export enum EventNames {
  Toggle = 'toggle',
}

export type Events = {
  [EventNames.Toggle]: { id: EntityId; isStar: boolean };
};
