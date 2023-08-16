import { type IpcMainInvokeEvent, Menu, BrowserWindow, shell } from 'electron';
import type { ContextmenuItem } from 'infra/ui';

export const UI_CHANNEL = 'electron-ui';

export const ui = {
  openNewWindow(e: IpcMainInvokeEvent, url: string) {
    return shell.openExternal(url);
  },
  createContextmenu(e: IpcMainInvokeEvent, menuItems: ContextmenuItem[]) {
    const w = BrowserWindow.fromWebContents(e.sender);

    if (!w) {
      return;
    }

    return new Promise((resolve) => {
      let key: string;
      const menu = Menu.buildFromTemplate(
        menuItems.map((item) => ({
          ...item,
          click: 'key' in item ? () => (key = item.key) : undefined,
          enabled: 'disabled' in item ? !item.disabled : true,
        })),
      );

      menu.popup({ window: w });
      menu.once('menu-will-close', () => {
        setTimeout(() => resolve(key || null), 100);
      });
    });
  },
};

export interface UIIpcPayload {
  funcName: string;
  args: unknown[];
}

export const UIHandler = function UIHandler(e: IpcMainInvokeEvent, { funcName, args }: UIIpcPayload) {
  if (!(funcName in ui)) {
    throw new Error(`invalid funcName: ${funcName}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((ui as any)[funcName] as any)(e, ...args);
};
