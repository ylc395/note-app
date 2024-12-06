import type { Record } from './types';

export enum EventNames {
  Pop = 'pop',
}

export type Events = {
  [EventNames.Pop]: Record;
};
