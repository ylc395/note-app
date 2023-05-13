import { type IpcMainInvokeEvent, Menu, BrowserWindow } from 'electron';
import type { ContextmenuItem } from 'infra/ui';

export const CONTEXTMENU_CHANNEL = 'showContextmenu';

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
