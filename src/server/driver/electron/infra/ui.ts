import { type IpcMainInvokeEvent, Menu, BrowserWindow, shell } from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';

import type { ContextmenuItem, ElectronUI } from '@domain/infra/ui';

const ui: ElectronUI = {
  openNewWindow(url: string) {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  },
  getActionFromContextmenu(menuItems: ContextmenuItem[], e?: IpcMainInvokeEvent) {
    const w = BrowserWindow.fromWebContents(e!.sender);

    if (!w) {
      return Promise.resolve(null);
    }

    return new Promise<string | null>((resolve) => {
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

export default ui;
