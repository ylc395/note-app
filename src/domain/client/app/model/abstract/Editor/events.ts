export enum EventNames {
  Destroy = 'destroy',
  Error = 'error',
}

export type EventsMap = {
  [EventNames.Destroy]: undefined;
  [EventNames.Error]: unknown;
};
