export const UI_CHANNEL = 'electron-ui';

export type ContextmenuItem =
  | {
      label: string;
      key: string;
      disabled?: boolean;
      visible?: boolean;
    }
  | { type: 'separator' };

export interface ElectronUI {
  getActionFromContextmenu: (items: ContextmenuItem[]) => Promise<string | null>;
  openNewWindow: (url: string) => Promise<void> | void;
}

export interface UIIpcPayload {
  funcName: string;
  args: unknown[];
}
