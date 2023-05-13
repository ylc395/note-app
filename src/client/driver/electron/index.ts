import { app as electronApp, BrowserWindow, ipcMain, protocol } from 'electron';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { hostname } from 'node:os';
import { Emitter } from 'strict-event-emitter';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import {
  type AppClient,
  type ClientInfo,
  type Events as AppClientEvents,
  EventNames as AppClientEventNames,
} from 'infra/appClient';
import type { KvDatabase } from 'infra/kvDatabase';
import { APP_FILE_PROTOCOL } from 'infra/constants';

import { CONTEXTMENU_CHANNEL, createContextmenu } from './contextmenu';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV || 'development';

export default class ElectronClient extends Emitter<AppClientEvents> implements AppClient {
  private mainWindow?: BrowserWindow;
  private clientInfo?: ClientInfo;

  constructor(private readonly kvDb: KvDatabase) {
    super();
    protocol.registerSchemesAsPrivileged([
      {
        scheme: APP_FILE_PROTOCOL,
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

    await this.initClientInfo();
    this.emit(AppClientEventNames.Ready);

    await this.initWindow();
  }

  readonly getDataDir = () => {
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

  private async initClientInfo() {
    this.clientInfo = {
      clientId: await this.kvDb.get('app.desktop.id', randomUUID),
      appName: APP_NAME,
      deviceName: hostname(),
    };
  }

  getClientInfo() {
    if (!this.clientInfo) {
      throw new Error('no client info');
    }

    return this.clientInfo;
  }

  pushMessage<T>(channel: string, payload: T) {
    if (!this.mainWindow) {
      throw new Error('no window');
    }

    this.mainWindow.webContents.send(channel, payload);
  }
}
