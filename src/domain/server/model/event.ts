import type { EntityLocator } from './entity.js';

export interface Event<T = unknown> {
  type: string;
  entityLocator: EntityLocator | null;
  deviceName: string;
  payload: T;
  time?: number;
}

export interface EventQuery {
  since: number;
}
