export interface LocalClient {
  start: () => Promise<void>;
  getConfigDir: () => string;
  getDeviceName: () => string;
}

export const token = Symbol('electron');
