import { ipcRenderer } from 'electron';

import type { UI } from '@domain/infra/ui';
import { type UIIpcPayload, UI_CHANNEL } from '../UI';

const invoke =
  (funcName: keyof UI) =>
  (...args: unknown[]) => {
    const payload: UIIpcPayload = { args, funcName };
    console.log('[electron-ui]', payload);
    return ipcRenderer.invoke(UI_CHANNEL, payload);
  };

// can not use Proxy here, so use a plain object instead
// see https://www.electronjs.org/docs/latest/api/context-bridge#api
const proxyUI: UI = {
  openNewWindow: invoke('openNewWindow'),
  getActionFromMenu: invoke('getActionFromMenu'),
  feedback: invoke('feedback'),
};

export default proxyUI;
