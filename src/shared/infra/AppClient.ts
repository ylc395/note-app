export interface AppClient {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
}

export const token = Symbol('appClient');
