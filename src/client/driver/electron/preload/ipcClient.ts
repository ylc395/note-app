import { ipcRenderer } from 'electron';
import { omitBy, isUndefined, isPlainObject } from 'lodash-es';
import type { Remote } from '@domain/common/infra/remote';
import { IPC_CHANNEL, type IpcRequest } from '@shared/domain/infra/transport';

const createMethod = <T, H>(method: IpcRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: IpcRequest<T> = { path, method };
    const payloadField = ['POST', 'PATCH', 'PUT'].includes(method) ? 'body' : 'query';

    if (payload) {
      // payload may be an ArrayBuffer or something else
      request[payloadField] = isPlainObject(payload) ? (omitBy(payload, isUndefined) as T) : payload;
    }

    const queryIndex = path.indexOf('?');

    if (queryIndex >= 0) {
      const query = new URLSearchParams(path.slice(queryIndex));
      request.query = { ...request.query, ...Object.fromEntries(query.entries()) } as T;
      request.path = path.slice(0, queryIndex);
    }

    if (headers) {
      request.headers = headers;
    }

    console.log('[ipc]request:', request);

    const response = await ipcRenderer.invoke(IPC_CHANNEL, request);
    console.log(`[ipc]response (${path}):`, response);

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
