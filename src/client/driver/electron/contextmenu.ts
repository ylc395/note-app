import { type IpcMainInvokeEvent, Menu, BrowserWindow } from 'electron';
import type { MenuItem } from 'infra/Contextmenu';

export const CONTEXTMENU_CHANNEL = 'showContextmenu';

export function createContextmenu(e: IpcMainInvokeEvent, menuItems: MenuItem[]) {
  const w = BrowserWindow.fromWebContents(e.sender);

  if (!w) {
    return;
  }

  return new Promise((resolve) => {
    let key: MenuItem['key'];
    const menu = Menu.buildFromTemplate(
      menuItems.map((item) => ({
        ...item,
        click: () => {
          key = item.key;
        },
      })),
    );

    menu.popup({ window: w });
    menu.on('menu-will-close', () => {
      setTimeout(() => resolve(key || null), 100);
    });
  });
}
