import { app as electronApp, BrowserWindow, ipcMain, protocol } from 'electron';
import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import { type AppClient, EventNames as AppClientEventNames } from 'infra/appClient';
import { APP_FILE_PROTOCOL } from 'infra/constants';

import { UI_CHANNELS, createContextmenu, openNewWindow } from './ui';
import BaseClient from './BaseClient';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV;
const ENTRY_URL = process.env.VITE_SERVER_ENTRY_URL;

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_FILE_PROTOCOL,
    privileges: {
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

@Injectable()
export default class ElectronClient extends BaseClient implements AppClient {
  private mainWindow?: BrowserWindow;
  readonly headless = true;

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

    ipcMain.handle(UI_CHANNELS.CONTEXTMENU, createContextmenu);
    ipcMain.handle(UI_CHANNELS.NEW_WINDOW, openNewWindow);

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

    await super.start();
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

    this.mainWindow.webContents.on('will-navigate', (e, url) => {
      if (NODE_ENV !== 'development' || url !== ENTRY_URL) {
        e.preventDefault();
      }
    });

    if (NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.mainWindow.loadURL(ENTRY_URL!);
      this.mainWindow.webContents.openDevTools();
    }
  }

  pushMessage<T>(channel: string, payload: T) {
    if (!this.mainWindow) {
      throw new Error('no window');
    }

    this.mainWindow.webContents.send(channel, payload);
  }
}
