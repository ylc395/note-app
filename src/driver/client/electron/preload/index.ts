import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';
import electronUI from './electronUI';

contextBridge.exposeInMainWorld('electronUI', electronUI);

process.once('loaded', exposeElectronTRPC);
