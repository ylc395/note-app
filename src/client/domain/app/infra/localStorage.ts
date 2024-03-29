import type { InjectionToken } from 'tsyringe';

export interface LocalStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

export const token: InjectionToken<LocalStorage> = Symbol();

export const KEY = {
  EXPLORER: {
    CURRENT_EXPLORER: 'explore.current',
    EXTRA_PANELS: 'explorer.extraPanels',
  },
} as const;
