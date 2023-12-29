import {
  type IpcMainInvokeEvent,
  Menu,
  BrowserWindow,
  shell,
  ipcMain,
  type MenuItemConstructorOptions as ElectronMenuItem,
} from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';
import assert from 'node:assert';
import { object, string, array, unknown as zodUnknown, type infer as ZodInfer } from 'zod';

import type { MenuItem, UI } from '../../domain/app/infra/ui.js';

export const UI_CHANNEL = 'electron-ui';

const uiIpcPayloadSchema = object({
  funcName: string().refine((v) => !v.startsWith('_')),
  args: array(zodUnknown()),
});

export type UIIpcPayload = ZodInfer<typeof uiIpcPayloadSchema>;

export default class ElectronUI implements UI {
  constructor() {
    ipcMain.handle(UI_CHANNEL, this._ipcHandler);
  }

  private e?: IpcMainInvokeEvent;

  private readonly _ipcHandler = (e: IpcMainInvokeEvent, payload: unknown) => {
    const p = uiIpcPayloadSchema.parse(payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert(p.funcName in this && typeof (this[p.funcName as keyof ElectronUI] as any) === 'function');

    this.e = e;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this[p.funcName as keyof ElectronUI] as any).apply(this, p.args);
  };

  feedback(): never {
    assert.fail('not implement');
  }

  showModal(): never {
    assert.fail('not implement');
  }

  openNewWindow(url: string) {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  }

  getActionFromMenu(menuItems: MenuItem[], pos?: { x: number; y: number }) {
    const w = BrowserWindow.fromWebContents(this.e!.sender);
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
}
