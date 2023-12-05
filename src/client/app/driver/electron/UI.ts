import { type IpcMainInvokeEvent, Menu, BrowserWindow, shell, ipcMain } from 'electron';
import { BLANK_URL, sanitizeUrl } from '@braintree/sanitize-url';
import { object, string, array, unknown as zodUnknown, type infer as ZodInfer } from 'zod';
import assert from 'assert';

import type { ContextmenuItem, UI } from '@domain/infra/ui';

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

  private readonly _ipcHandler = (e: IpcMainInvokeEvent, payload: unknown) => {
    const p = uiIpcPayloadSchema.parse(payload);
    assert(p.funcName in this && typeof this === 'function');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this[p.funcName] as any).call(this, ...p.args, e);
  };

  feedback(): never {
    assert.fail('not implement');
  }

  openNewWindow(url: string) {
    if (url !== BLANK_URL && sanitizeUrl(url) === BLANK_URL) {
      return Promise.reject('unsafe url');
    }

    return shell.openExternal(url);
  }

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

      menu.popup({
        window: w,
        callback: () => resolve(key || null),
      });
    });
  }
}
