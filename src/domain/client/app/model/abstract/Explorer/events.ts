import type { EntityId } from '#domain/shared/model/entity';

export enum EventNames {
  Revealed = 'Revealed',
}

export type Events = {
  [EventNames.Revealed]: EntityId;
};
