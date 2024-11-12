import {
  Menu,
  BrowserWindow,
  shell,
  type MenuItemConstructorOptions as ElectronMenuItem,
  type IpcMainInvokeEvent,
} from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';
import assert from 'node:assert';
import { type MenuItem, type UI, type UIIpcPayload, uiIpcPayloadSchema } from '#domain/shared/infra/ui.js';

export { UI_CHANNEL } from '#domain/shared/infra/ui.js';

export default class electronUI implements Partial<UI> {
  public ipcEvent?: IpcMainInvokeEvent;

  public openNewWindow(url: string) {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  }

  public getActionFromMenu(menuItems: MenuItem[], pos?: { x: number; y: number }) {
    assert(this.ipcEvent);
    const w = BrowserWindow.fromWebContents(this.ipcEvent.sender);
    assert(w);

    return new Promise<string | number | null>((resolve) => {
      let key: string | number;

      const menu = Menu.buildFromTemplate(
        menuItems.map(function mapping(item): ElectronMenuItem {
          return {
            ...item,
            type: 'type' in item ? item.type : item.checked ? 'checkbox' : undefined,
            submenu: 'submenu' in item && item.submenu ? item.submenu.map(mapping) : undefined,
            click: 'key' in item ? () => (key = item.key!) : undefined,
            enabled: 'disabled' in item ? !item.disabled : true,
          };
        }),
      );

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
}
