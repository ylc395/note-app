import type { Emitter, EventMap } from 'strict-event-emitter';

export enum EventNames {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

export interface Events extends EventMap {
  [EventNames.BeforeStart]: [];
  [EventNames.Ready]: [];
}

export interface AppClient extends Emitter<Events> {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
  getAppId: () => string;
  getAppName: () => string;
  pushMessage: <T>(channel: string, payload: T) => void;
}

export const token = Symbol('appClient');
