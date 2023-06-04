import type { InjectionToken } from 'tsyringe';

export type ContextmenuItem =
  | {
      label: string;
      key: string;
      disabled?: boolean;
      visible?: boolean;
    }
  | { type: 'separator' };

export interface UI {
  getActionFromContextmenu: (items: ContextmenuItem[]) => Promise<string | null>;
  feedback: (options: { type: 'success' | 'fail'; content: string; onClick?: () => void }) => Promise<void>;
  openNewWindow: (url: string) => void;
}

export const token: InjectionToken<UI> = Symbol();
