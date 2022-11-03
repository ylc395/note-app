import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { InvalidInputError, type InvalidInputErrorCause } from 'model/Error';
import { IPC_CHANNEL, type IpcResponse, type IpcRequest } from './ipc';

const createMethod = <T, K>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T) => {
    const fields = method === 'GET' ? { query: payload } : { body: payload };
    const request: IpcRequest<T> = { path, method, ...fields };
    console.log('request:', request);

    const response: IpcResponse<K> = await ipcRenderer.invoke(IPC_CHANNEL, request);
    const { status, body } = response;
    console.log('response:', response);

    if (status < 200 || status > 299) {
      const { error } = body;

      if (status >= 400 && status < 500 && error) {
        throw new InvalidInputError(
          `Request Failed: ${error.message}.`,
          error.cause ? { cause: error.cause as InvalidInputErrorCause } : undefined,
        );
      }

      throw new Error(`Request Failed: ${error?.message || 'unknown reason'}`);
    }

    return response as IpcResponse<K>;
  };
};

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
};

contextBridge.exposeInMainWorld('electronIpc', client);
