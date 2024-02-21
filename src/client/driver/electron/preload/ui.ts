import { ipcRenderer } from 'electron';

import { type UI, type UIIpcPayload, UI_CHANNEL } from '@shared/domain/infra/ui';

const invoke =
  (funcName: keyof UI) =>
  (...args: unknown[]) => {
    const payload: UIIpcPayload = { args, funcName };
    console.log('[electron-ui]', payload);
    return ipcRenderer.invoke(UI_CHANNEL, payload);
  };

const notImplement = () => {
  throw new Error('not implement');
};

// can not use Proxy here, so use a plain object instead
// see https://www.electronjs.org/docs/latest/api/context-bridge#api
const proxyUI: UI = {
  openNewWindow: invoke('openNewWindow'),
  getActionFromMenu: invoke('getActionFromMenu'),
  prompt: notImplement,
};

export default proxyUI;
