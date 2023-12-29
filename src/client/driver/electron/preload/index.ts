import { contextBridge } from 'electron';
import ipcClient from './ipcClient';
import ui from './ui';

contextBridge.exposeInMainWorld('electronIpcHttpClient', ipcClient);
contextBridge.exposeInMainWorld('electronUI', ui);
contextBridge.exposeInMainWorld('IS_ELECTRON', true);
