import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { IPC_CHANNEL, type IpcResponse, type IpcRequest } from './ipc';

const createMethod = (method: IpcRequest<unknown>['method']) => {
  return async <T, K>(path: string, body: T) => {
    const payload = method === 'GET' ? { query: body } : { body };
    const request: IpcRequest<T> = { path, method, ...payload };
    console.log(request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log(response);

    return response as IpcResponse<K>;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
};

contextBridge.exposeInMainWorld('electronIpc', client);
