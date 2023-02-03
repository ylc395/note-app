import type { InjectionToken } from 'tsyringe';

export type MenuItem =
  | {
      label: string;
      key: string;
    }
  | { type: 'separator' };

export interface Contextmenu {
  popup: (items: MenuItem[]) => Promise<string | null>;
}

export const token: InjectionToken<Contextmenu> = Symbol('contextmenu');
