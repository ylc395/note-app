import { ipcRenderer } from 'electron';
import { type ElectronUI, type UIIpcPayload, UI_CHANNEL } from '#domain/shared/infra/ui/electron';

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

export default proxyUI;
