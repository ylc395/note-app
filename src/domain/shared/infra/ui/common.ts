/// <reference lib="dom" />
import type { InjectionToken } from 'tsyringe';
import type { MenuItem } from './menu.js';

export interface UI {
  getActionFromMenu: (items: MenuItem[], pos?: { x: number; y: number }) => Promise<string | number | null>;
  openNewWindow: (url: string) => void;
  selectFiles: () => Promise<FileList | null>;
}

export const token: InjectionToken<UI> = Symbol();

export * from './menu.js';
