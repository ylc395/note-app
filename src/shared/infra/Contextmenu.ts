import type { InjectionToken } from 'tsyringe';

export interface MenuItem {
  label: string;
  key: string;
}

export interface Contextmenu {
  popup: (items: MenuItem[]) => Promise<MenuItem['key'] | null>;
}

export const token: InjectionToken<Contextmenu> = Symbol('contextmenu');
