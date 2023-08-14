import { app as electronApp, BrowserWindow, ipcMain } from 'electron';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'node:path';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import ClientApp from 'infra/ClientApp';
import { IS_DEV } from 'infra/constants';

import { UI_CHANNELS, createContextmenu, openNewWindow } from './ui';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const INDEX_URL = process.env.VITE_SERVER_ENTRY_URL!;

@Injectable()
export default class ElectronApp extends ClientApp {
  private readonly logger = new Logger('electron app');
  private mainWindow?: BrowserWindow;
  readonly type = 'electron';

  async start() {
    if (IS_DEV) {
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

    if (IS_DEV) {
      try {
        this.logger.verbose('try to install devtool');
        await installExtension(REACT_DEVELOPER_TOOLS);
        this.logger.verbose('devtool installed');
      } catch (error) {
        this.logger.error(error);
      }
    }

    await super.start();
    await this.initWindow();
  }

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
      // allow reload in dev env
      if (IS_DEV && url === INDEX_URL) {
        return;
      }

      this.logger.warn(`prevent from redirect to ${url}`);
      e.preventDefault();
    });

    if (IS_DEV) {
      await this.mainWindow.loadURL(INDEX_URL);
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
