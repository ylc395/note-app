import { ipcRenderer } from 'electron';
import { UI_CHANNEL, type UIIpcPayload, type ui } from '../ui';

const uiFuncNames: (keyof typeof ui)[] = ['openNewWindow', 'createContextmenu'];

const proxyUI = uiFuncNames.reduce((proxy, funcName) => {
  proxy[funcName] = (...args: unknown[]) => {
    return ipcRenderer.invoke(UI_CHANNEL, { args, funcName } satisfies UIIpcPayload);
  };

  return proxy;
}, {} as Record<keyof typeof ui, (...args: unknown[]) => void>);

export default proxyUI;
