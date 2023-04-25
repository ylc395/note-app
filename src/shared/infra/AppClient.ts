import type { EventEmitter } from 'eventemitter3';

export interface AppClient extends EventEmitter {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
  getAppName: () => string;
}

export enum Events {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

export const token = Symbol('appClient');
