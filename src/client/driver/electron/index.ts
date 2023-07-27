import { app as electronApp, BrowserWindow, ipcMain, protocol } from 'electron';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'node:path';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import ClientApp, { EventNames as ClientAppEventNames } from 'infra/ClientApp';
import { APP_PROTOCOL, IS_DEV } from 'infra/constants';

import { UI_CHANNELS, createContextmenu, openNewWindow } from './ui';

@Injectable()
export default class ElectronApp extends ClientApp {
  static {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: APP_PROTOCOL,
        privileges: {
          supportFetchAPI: true,
          stream: true,
        },
      },
    ]);
  }
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
    this.emit(ClientAppEventNames.Ready);

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
      this.logger.warn(`prevent from redirect to ${url}`);
      e.preventDefault();
    });

    if (IS_DEV) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.mainWindow.loadURL(process.env.VITE_SERVER_ENTRY_URL!);
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
