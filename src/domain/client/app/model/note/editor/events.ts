import type BaseEditor from './BaseEditor';

export enum EventNames {
  Destroy = 'destroy',
}

export type Events = {
  [EventNames.Destroy]: BaseEditor;
};
