import { Menu, shell, type MenuItem, type MenuItemConstructorOptions } from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';

import type { UI } from '#domain/client/shared/infra/ui.js';
import { type UIIpcPayload, uiIpcPayloadSchema, UI_CHANNEL } from './uiChannel.js';

export default class ElectronUI {
  public readonly openNewWindow: UI['openNewWindow'] = (url: string) => {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  };

  public getActionFromMenu(menuItems: MenuItemConstructorOptions[], pos?: { x: number; y: number }) {
    return new Promise<string | null>((resolve) => {
      let key: string;

      const onClick = ({ id }: MenuItem) => {
        key = id;
      };

      const menuItemsMapper = (item: MenuItemConstructorOptions, path: number[]): MenuItemConstructorOptions => {
        return {
          ...item,
          click: onClick,
          submenu: Array.isArray(item.submenu)
            ? item.submenu.map((item, i) => menuItemsMapper(item, [...path, i]))
            : item.submenu,
        };
      };

      const menu = Menu.buildFromTemplate(menuItems.map((item, i) => menuItemsMapper(item, [i])));

      menu.popup({
        ...(pos ? { x: Math.ceil(pos.x), y: Math.ceil(pos.y) } : null), // a float number will throw an error
        callback: () => resolve(key || null),
      });
    });
  }

  public static isValidPayload(payload: unknown): payload is UIIpcPayload {
    const p = uiIpcPayloadSchema.safeParse(payload);
    return p.success;
  }

  public static RPC_CHANNEL = UI_CHANNEL;
}
