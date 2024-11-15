export enum EventNames {
  Destroyed = 'destroyed',
  Submitted = 'Submitted',
}

export type Events = {
  [EventNames.Destroyed]: undefined;
  [EventNames.Submitted]: undefined;
};
