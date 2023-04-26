import type { EventEmitter } from 'node:events';

export interface AppClient extends EventEmitter {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
  getAppId: () => string;
  getAppName: () => string;
  pushMessage: <T>(channel: string, payload: T) => void;
}

export enum Events {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

export const token = Symbol('appClient');
