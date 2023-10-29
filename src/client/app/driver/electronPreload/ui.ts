import { ipcRenderer } from 'electron';
import { type ElectronUI, type UIIpcPayload, UI_CHANNEL } from 'infra/ui';

const invoke =
  (funcName: keyof ElectronUI) =>
  (...args: unknown[]) => {
    return ipcRenderer.invoke(UI_CHANNEL, { args, funcName } satisfies UIIpcPayload);
  };

// can not use Proxy here, so use a plain object instead
// see https://www.electronjs.org/docs/latest/api/context-bridge#api
const proxyUI: ElectronUI = {
  openNewWindow: invoke('openNewWindow'),
  getActionFromContextmenu: invoke('getActionFromContextmenu'),
};

export default proxyUI;
