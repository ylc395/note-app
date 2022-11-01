import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { IPC_CHANNEL, type IpcResponse, type IpcRequest } from './ipc';

const createMethod = <T, K>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T) => {
    const fields = method === 'GET' ? { query: payload } : { body: payload };
    const request: IpcRequest<T> = { path, method, ...fields };
    console.log('request:', request);

    const response: IpcResponse<K> = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log('response:', response);

    if (response.status < 200 || response.status > 299) {
      throw new Error(response.body.error || 'unknown error');
    }

    return response as IpcResponse<K>;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
};

contextBridge.exposeInMainWorld('electronIpc', client);
