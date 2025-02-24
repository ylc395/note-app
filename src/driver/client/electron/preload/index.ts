import { contextBridge } from 'electron';
import { exposeElectronTRPC } from 'electron-trpc/main';
import electronUtils from './electronUtils';

contextBridge.exposeInMainWorld('electronUtils', electronUtils);
process.once('loaded', exposeElectronTRPC);
