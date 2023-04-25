import type { EventEmitter } from 'eventemitter3';

export interface AppClient extends EventEmitter {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
  getDeviceId: () => string;
  getAppName: () => string;
  pushMessage: <T>(channel: string, payload: T) => void;
}

export enum Events {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

export const token = Symbol('appClient');
