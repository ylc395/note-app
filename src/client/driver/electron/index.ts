import { app as electronApp, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { hostname } from 'os';
import EventEmitter from 'eventemitter3';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import { type AppClient, Events as AppClientEvents } from 'infra/AppClient';

import { CONTEXTMENU_CHANNEL, createContextmenu } from './contextmenu';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV || 'development';
const NEED_CLEAN = process.env.DEV_CLEAN === '1';

export default class ElectronClient extends EventEmitter implements AppClient {
  private mainWindow?: BrowserWindow;

  constructor() {
    super();
    const dir = this.getConfigDir();
    ensureDirSync(dir);

    if (NODE_ENV === 'development' && NEED_CLEAN) {
      emptyDirSync(dir);
    }

    console.log(`electron: initialized in ${dir}`);
  }

  async start() {
    this.emit(AppClientEvents.BeforeStart);

    if (NODE_ENV === 'development') {
      if (process.platform === 'win32') {
        process.on('message', (data) => {
          if (data === 'graceful-exit') {
            electronApp.quit();
          }
        });
      } else {
        process.on('SIGTERM', () => {
          electronApp.quit();
        });
      }
    }

    // https://www.electronjs.org/docs/latest/api/app#event-window-all-closed
    electronApp.on('window-all-closed', () => {
      electronApp.quit();
    });

    ipcMain.handle(CONTEXTMENU_CHANNEL, createContextmenu);

    await electronApp.whenReady();

    if (NODE_ENV === 'development') {
      try {
        console.log('try to install devtool');
        await installExtension(REACT_DEVELOPER_TOOLS);
        console.log('devtool installed');
      } catch (error) {
        console.error(error);
      }
    }

    this.emit(AppClientEvents.Ready);
    await this.initWindow();
  }

  readonly getConfigDir = () => {
    return join(electronApp.getPath('appData'), `${APP_NAME}${NODE_ENV === 'development' ? '-dev' : ''}`);
  };

  private async initWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
      },
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = undefined;
    });

    if (NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.mainWindow.loadURL(process.env['VITE_SERVER_ENTRY_URL']!);
      this.mainWindow.webContents.openDevTools();
    }
  }

  getDeviceName() {
    return hostname();
  }

  getAppName() {
    return APP_NAME;
  }

  pushMessage<T>(channel: string, payload: T) {
    if (!this.mainWindow) {
      throw new Error('no window');
    }

    this.mainWindow.webContents.send(channel, payload);
  }

  getDeviceId() {
    return '';
  }
}
