import type { Emitter, EventMap } from 'strict-event-emitter';

export enum EventNames {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

export interface Events extends EventMap {
  [EventNames.BeforeStart]: [];
  [EventNames.Ready]: [];
}

export interface ClientInfo {
  clientId: string;
  appName: string;
  deviceName: string;
}

export interface AppClient extends Emitter<Events> {
  headless: boolean;
  start: () => Promise<void>;
  getDataDir: () => string;
  getClientInfo: () => ClientInfo;
  pushMessage?: <T>(channel: string, payload: T) => void;
}

export const token = Symbol('appClient');
