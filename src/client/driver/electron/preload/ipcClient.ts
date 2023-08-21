import { ipcRenderer } from 'electron';
import omitBy from 'lodash/omitBy';
import isObject from 'lodash/isObject';

import type { Remote } from 'infra/remote';
import { FAKE_HTTP_CHANNEL, type FakeHttpRequest } from 'infra/fakeHttp';

const createMethod = <T, H>(method: FakeHttpRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: FakeHttpRequest<T> = { path, method };

    if (payload !== undefined) {
      request[['POST', 'PATCH', 'PUT'].includes(method) ? 'body' : 'query'] =
        isObject(payload) && !Array.isArray(payload) ? (omitBy(payload, (v) => v === undefined) as T) : payload;
    }

    if (headers) {
      request.headers = headers;
    }

    console.log('☎️request:', request);

    const response = await ipcRenderer.invoke(FAKE_HTTP_CHANNEL, request);
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
