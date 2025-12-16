import { Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { BLANK_URL } from '@braintree/sanitize-url/dist/constants.js';
import { uniqueId } from 'lodash-es';
import type { IpcMainInvokeEvent } from 'electron/renderer';

import { MENU_CLICK_CHANNEL, MENU_CLOSE_CHANNEL, type MenuClickEvent, type MenuCloseEvent } from './channels.js';

export interface MenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator';
  submenu?: MenuItem[];
}

export default class ElectronUI {
  private readonly menus: Record<string, Menu> = {};

  public openMenu(sender: IpcMainInvokeEvent['sender'], menuItems: MenuItem[], pos?: { x: number; y: number }) {
    const menuId = uniqueId('native-menu-');
    const menuItemsMapper = (item: MenuItem): MenuItemConstructorOptions => {
      return {
        ...item,
        submenu: Array.isArray(item.submenu) ? item.submenu.map(menuItemsMapper) : item.submenu,
        click: ({ id }) => {
          sender.send(MENU_CLICK_CHANNEL, { menuId, key: id } satisfies MenuClickEvent);
        },
      };
    };

    const menu = Menu.buildFromTemplate(menuItems.map(menuItemsMapper));
    this.menus[menuId] = menu;

    menu.popup({
      ...(pos ? { x: Math.ceil(pos.x), y: Math.ceil(pos.y) } : null), // a float number will throw an error
      callback: () => {
        sender.send(MENU_CLOSE_CHANNEL, { menuId } satisfies MenuCloseEvent);
      },
    });

    return menuId;
  }

  public closeMenu(id: string) {
    const menu = this.menus[id];

    if (menu) {
      menu.closePopup();
      delete this.menus[id];
    }
  }

  public static openUrl(url: string) {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  }
}
