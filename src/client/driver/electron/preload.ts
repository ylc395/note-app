import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronIpc', {
  request: (data: any) => ipcRenderer.invoke('fakeHttp', data),
});
