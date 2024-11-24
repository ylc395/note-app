export enum EventNames {
  Destroy = 'destroy',
  Error = 'error',
}

export type Events = {
  [EventNames.Destroy]: undefined;
  [EventNames.Error]: unknown;
};
