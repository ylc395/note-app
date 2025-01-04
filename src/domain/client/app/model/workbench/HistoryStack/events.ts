import type { Direction, Record } from './types';

export enum EventNames {
  Pop = 'pop',
}

export type Events = {
  [EventNames.Pop]: { record: Record; direction: Direction };
};
