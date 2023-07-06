import { type IpcMainInvokeEvent, Menu, BrowserWindow, shell } from 'electron';
import type { ContextmenuItem } from 'infra/ui';

export const UI_CHANNELS = {
  CONTEXTMENU: 'showContextmenu',
  NEW_WINDOW: 'newWindow',
} as const;

export function openNewWindow(e: IpcMainInvokeEvent, url: string) {
  return shell.openExternal(url);
}

export function createContextmenu(e: IpcMainInvokeEvent, menuItems: ContextmenuItem[]) {
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
}
