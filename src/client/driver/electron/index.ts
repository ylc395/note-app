import { app as electronApp, BrowserWindow, ipcMain, protocol } from 'electron';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { hostname } from 'node:os';
import { ensureDirSync, emptyDirSync } from 'fs-extra';
import { Emitter } from 'strict-event-emitter';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import memoize from 'lodash/memoize';

import { type AppClient, EventNames as AppClientEventNames, type Events as AppClientEvents } from 'infra/AppClient';
import { appFileProtocol } from 'infra/electronProtocol';
import { load } from 'shared/driver/sqlite/kv';

import { CONTEXTMENU_CHANNEL, createContextmenu } from './contextmenu';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV || 'development';
const NEED_CLEAN = process.env.DEV_CLEAN === '1';

class ElectronClient extends Emitter<AppClientEvents> implements AppClient {
  private mainWindow?: BrowserWindow;
  private appId?: string;

  constructor() {
    super();
    const dir = this.getConfigDir();
    ensureDirSync(dir);

    if (NODE_ENV === 'development' && NEED_CLEAN) {
      emptyDirSync(dir);
    }

    console.log(`electron: initialized in ${dir}`);

    protocol.registerSchemesAsPrivileged([
      {
        scheme: appFileProtocol,
        privileges: {
          supportFetchAPI: true,
          stream: true,
        },
      },
    ]);
  }

  async start() {
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

    this.emit(AppClientEventNames.Ready);

    await this.initWindow();
    await this.initAppId();
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

  private async initAppId() {
    const key = 'app.desktop.id';
    this.appId = await load(key, randomUUID);
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

  getAppId() {
    if (!this.appId) {
      throw new Error('no app id');
    }

    return this.appId;
  }
}

const factory = memoize(() => new ElectronClient());

export default factory;
