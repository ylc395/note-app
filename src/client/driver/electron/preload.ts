import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/remote';
import type { ContextmenuItem } from 'infra/ui';
// import { SYNC_LOG_CHANNEL } from 'infra/constants';

import { IPC_CHANNEL, type IpcRequest } from './ipc';
import { CONTEXTMENU_CHANNEL } from './contextmenu';

const createMethod = <T, H>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: IpcRequest<T> = { path, method };

    if (payload !== undefined) {
      request[['POST', 'PATCH', 'PUT'].includes(method) ? 'body' : 'query'] = payload;
    }

    if (headers) {
      request.headers = headers;
    }

    console.log('☎️request:', request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log('🎺response:', response);

    return response;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  delete: createMethod('DELETE'),
  patch: createMethod('PATCH'),
  put: createMethod('PUT'),
};

const getActionFromContextmenu = (menuItems: ContextmenuItem[]) => {
  if (menuItems.length === 0) {
    return null;
  }

  return ipcRenderer.invoke(CONTEXTMENU_CHANNEL, menuItems);
};

// const onSynchronizationLogUpdated = (cb: (log: Log) => void) =>
//   ipcRenderer.on(SYNC_LOG_CHANNEL, (_, payload) => cb(payload));

contextBridge.exposeInMainWorld('electronIpcHttpClient', client);
contextBridge.exposeInMainWorld('electronIpcContextmenu', getActionFromContextmenu);
// contextBridge.exposeInMainWorld('electronOnSynchronizationLogUpdated', onSynchronizationLogUpdated);
