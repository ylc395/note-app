import { app as electronApp, BrowserWindow, ipcMain } from 'electron';
import { Injectable, Logger } from '@nestjs/common';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import type { AppServerStatus } from 'model/app';
import ClientApp from 'infra/ClientApp';
import { IS_DEV } from 'infra/constants';
import { UI_CHANNEL, UIHandler } from './ui';

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

    ipcMain.handle(UI_CHANNEL, UIHandler);

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
        preload: path.join(__dirname, 'preload.js'),
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

  async getAppToken() {
    return await this.kvDb.get('app.http.token', randomUUID);
  }

  private httpServerWorker?: Worker;
  private httpServerWorkerStatus: 'offline' | 'terminating' | 'online' | 'starting' = 'offline';

  private terminateServer() {
    if (!this.httpServerWorker) {
      throw new Error('no server');
    }

    if (this.httpServerWorkerStatus !== 'terminating') {
      throw new Error('not terminating');
    }

    this.httpServerWorkerStatus = 'offline';
    this.httpServerWorker?.terminate();
    this.httpServerWorker = undefined;
  }

  readonly toggleHttpServer = (enable: boolean) => {
    if (enable) {
      return new Promise<AppServerStatus>((resolve) => {
        if (this.httpServerWorkerStatus !== 'offline') {
          throw new Error('not offline');
        }

        const worker = new Worker(path.resolve(path.dirname(__dirname), '../../server/bootstrap.httpServer.js'));
        this.httpServerWorker = worker;
        this.httpServerWorkerStatus = 'starting';

        worker.on('message', (message) => {
          switch (message.type) {
            case 'started':
              this.httpServerWorkerStatus = 'online';
              resolve(message.payload);
              break;
            default:
              break;
          }
        });
      });
    } else {
      return new Promise<null>((resolve) => {
        if (!this.httpServerWorker) {
          throw new Error('offline already');
        }

        if (this.httpServerWorkerStatus !== 'online') {
          throw new Error('not online');
        }

        this.httpServerWorkerStatus = 'terminating';
        this.httpServerWorker.on('message', (message) => {
          switch (message.type) {
            case 'terminated':
              this.terminateServer();
              resolve(null);
              break;
            default:
              break;
          }
        });
        this.httpServerWorker.postMessage({ type: 'offline' });
      });
    }
  };
}
