import { contextBridge, ipcRenderer } from 'electron';
import omitBy from 'lodash/omitBy';

import type { Remote } from 'infra/remote';
import type { ContextmenuItem, UI } from 'infra/ui';
// import { SYNC_LOG_CHANNEL } from 'infra/constants';

import { FAKE_HTTP_CHANNEL, type FakeHttpRequest } from 'infra/fakeHttp';
import { UI_CHANNELS } from './ui';

const createMethod = <T, H>(method: FakeHttpRequest<unknown>['method']) => {
  return async (path: string, payload: T, headers: H) => {
    const request: FakeHttpRequest<T> = { path, method };

    if (payload !== undefined) {
      request[['POST', 'PATCH', 'PUT'].includes(method) ? 'body' : 'query'] = omitBy(
        payload,
        (v) => v === undefined,
      ) as T;
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

const client: Remote = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  delete: createMethod('DELETE'),
  patch: createMethod('PATCH'),
  put: createMethod('PUT'),
};

const electronUI: Pick<UI, 'getActionFromContextmenu' | 'openNewWindow'> = {
  getActionFromContextmenu: (menuItems: ContextmenuItem[]) => {
    if (menuItems.length === 0) {
      return Promise.resolve(null);
    }

    return ipcRenderer.invoke(UI_CHANNELS.CONTEXTMENU, menuItems);
  },
  openNewWindow: (url: string) => {
    ipcRenderer.invoke(UI_CHANNELS.NEW_WINDOW, url);
  },
};

// const onSynchronizationLogUpdated = (cb: (log: Log) => void) =>
//   ipcRenderer.on(SYNC_LOG_CHANNEL, (_, payload) => cb(payload));

contextBridge.exposeInMainWorld('electronIpcHttpClient', client);
contextBridge.exposeInMainWorld('electronUI', electronUI);
// contextBridge.exposeInMainWorld('electronOnSynchronizationLogUpdated', onSynchronizationLogUpdated);
