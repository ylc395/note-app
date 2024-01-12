import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';
import ui from './ui';

contextBridge.exposeInMainWorld('electronUI', ui);
contextBridge.exposeInMainWorld('IS_ELECTRON', true);

process.once('loaded', exposeElectronTRPC);
