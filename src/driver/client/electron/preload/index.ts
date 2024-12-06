import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';
import { ipcRenderer } from 'electron';

import { type UIIpcPayload, UI_CHANNEL } from '../uiChannel';
import type ElectronUI from '../UI';

const invoke =
  (funcName: keyof ElectronUI) =>
  (...args: unknown[]) => {
    const payload: UIIpcPayload = { args, funcName };
    console.log('[electron-ui]', payload);
    return ipcRenderer.invoke(UI_CHANNEL, payload);
  };

// can not use Proxy here, so use a plain object instead
// see https://www.electronjs.org/docs/latest/api/context-bridge#api
const proxyUI: ElectronUI = {
  openNewWindow: invoke('openNewWindow'),
  getActionFromMenu: invoke('getActionFromMenu'),
};

contextBridge.exposeInMainWorld('electronUI', proxyUI);
contextBridge.exposeInMainWorld('IS_ELECTRON', true);
process.once('loaded', exposeElectronTRPC);
