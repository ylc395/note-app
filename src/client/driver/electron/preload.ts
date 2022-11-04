import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { IPC_CHANNEL, type IpcRequest } from './ipc';

const createMethod = <T>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T) => {
    const fields = method === 'GET' ? { query: payload } : { body: payload };
    const request: IpcRequest<T> = { path, method, ...fields };
    console.log('request:', request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log('response:', response);

    return response;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
};

contextBridge.exposeInMainWorld('electronIpc', client);
