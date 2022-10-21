import { contextBridge, ipcRenderer } from 'electron';

import type { Remote } from 'infra/Remote';
import { IPC_CHANNEL, type IpcRequest } from './ipc';

const client: Remote = {
  get(path, query) {
    const request: IpcRequest = { path, query, method: 'GET' };
    return ipcRenderer.invoke(IPC_CHANNEL, request);
  },
  post(path, body) {
    const request: IpcRequest = { path, body, method: 'POST' };
    return ipcRenderer.invoke(IPC_CHANNEL, request);
  },
};

contextBridge.exposeInMainWorld('electronIpc', client);
