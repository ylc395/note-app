import {
  Menu,
  BrowserWindow,
  shell,
  type MenuItemConstructorOptions as ElectronMenuItem,
  type IpcMainInvokeEvent,
} from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';
import assert from 'node:assert';
import { type MenuItem, type UI, type UIIpcPayload, uiIpcPayloadSchema } from '@shared/domain/infra/ui.js';

export { UI_CHANNEL } from '@shared/domain/infra/ui.js';

export default class electronUI implements UI {
  public ipcEvent?: IpcMainInvokeEvent;

  public feedback(): never {
    assert.fail('not implement');
  }

  public showModal(): never {
    assert.fail('not implement');
  }

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

    return new Promise<string | null>((resolve) => {
      let key: string;

      const menu = Menu.buildFromTemplate(
        menuItems.map(function mapping(item): ElectronMenuItem {
          return {
            ...item,
            submenu: 'submenu' in item && item.submenu ? item.submenu.map(mapping) : undefined,
            click: 'key' in item ? () => (key = item.key!) : undefined,
            enabled: 'disabled' in item ? !item.disabled : true,
          };
        }),
      );

      menu.popup({
        window: w,
        // a float number will throw an error
        ...(pos ? { x: Math.ceil(pos.x), y: Math.ceil(pos.y) } : null),
        callback: () => resolve(key || null),
      });
    });
  }

  public static isValidPayload(payload: unknown): payload is UIIpcPayload {
    const p = uiIpcPayloadSchema.safeParse(payload);
    return p.success;
  }
}
