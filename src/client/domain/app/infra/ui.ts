import type { InjectionToken } from 'tsyringe';

export type MenuItem =
  | {
      label: string;
      key?: string;
      disabled?: boolean;
      visible?: boolean;
    }
  | { type: 'separator' };

export interface UI {
  getActionFromMenu: (items: MenuItem[], pos?: { x: number; y: number }) => Promise<string | null>;
  openNewWindow: (url: string) => Promise<void> | void;
  feedback: (options: { type: 'success' | 'fail'; content: string; onClick?: () => void }) => Promise<void>;
}

export const token: InjectionToken<UI> = Symbol();