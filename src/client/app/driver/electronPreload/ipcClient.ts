import { ipcRenderer } from 'electron';
import omitBy from 'lodash/omitBy';
import isObject from 'lodash/isObject';

import type { Remote } from 'infra/remote';
import { IPC_CHANNEL, type IpcRequest } from 'infra/transport';

const createMethod = <T, H>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: IpcRequest<T> = { path, method };

    if (payload !== undefined) {
      request[['POST', 'PATCH', 'PUT'].includes(method) ? 'body' : 'query'] =
        isObject(payload) && !Array.isArray(payload) ? (omitBy(payload, (v) => v === undefined) as T) : payload;
    }

    if (headers) {
      request.headers = headers;
    }

    console.log('☎️request:', request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log(`🎺response (${path}):`, response);

    return response;
  };
};

const ipcClient: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  delete: createMethod('DELETE'),
  patch: createMethod('PATCH'),
  put: createMethod('PUT'),
};

export default ipcClient;
