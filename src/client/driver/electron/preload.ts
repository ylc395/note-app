import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { IPC_CHANNEL, type IpcRequest } from './ipc';

const createMethod = <T, H>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: IpcRequest<T> = { path, method };

    if (payload) {
      request[method === 'POST' ? 'body' : 'query'] = payload;
    }

    if (headers) {
      request.headers = headers;
    }

    console.log('request:', request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log('response:', response);

    return response;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  delete: createMethod('DELETE'),
};

contextBridge.exposeInMainWorld('electronIpc', client);
