import { app as electronApp, BrowserWindow } from 'electron';
import { Logger } from '@nestjs/common';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { type Remote, wrap, releaseProxy } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter.js';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import DesktopRuntime from '@domain/infra/DesktopRuntime.js';
import { IS_DEV } from '@domain/infra/constants.js';
import UI from '@client/driver/electron/UI.js';

import type LocalServer from '../localHttpServer/index.js';

const INDEX_URL = process.env.VITE_SERVER_ENTRY_URL!;
const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default class ElectronRuntime extends DesktopRuntime {
  private readonly logger = new Logger('electron app');
  private mainWindow?: BrowserWindow;
  private readonly ui = new UI();

  async start() {
    await super.start();

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

    electronApp.on('ready', async () => {
      if (IS_DEV) {
        try {
          this.logger.verbose('try to install devtool');
          const devToolName = await installExtension.default(REACT_DEVELOPER_TOOLS);
          this.logger.verbose(`${devToolName} installed`);
        } catch (error) {
          this.logger.error(error);
        }
      }

      await this.initWindow();
    });
  }

  private async initWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.resolve(DIRNAME, '../../../client/driver/electron/preload.js'),
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

  private httpServerWorker?: Worker;
  private httpServer?: Remote<LocalServer>;
  private httpServerStatus: 'offline' | 'terminating' | 'online' | 'starting' = 'offline';

  private async terminateServer() {
    if (!this.httpServerWorker || !this.httpServer) {
      throw new Error('no server');
    }

    if (this.httpServerStatus !== 'online') {
      throw new Error('not terminating');
    }

    this.httpServerStatus = 'terminating';
    await this.httpServer.close();
    this.httpServer[releaseProxy]();
    this.httpServer = undefined;
    this.httpServerWorker?.terminate();
    this.httpServerWorker = undefined;

    this.httpServerStatus = 'offline';
  }

  private async startServer() {
    if (this.httpServerStatus !== 'offline') {
      throw new Error('not offline');
    }

    const worker = new Worker(path.resolve(DIRNAME, '../../server/bootstrap.localServer.js'), {
      workerData: { runtime: 'http' },
    });

    this.httpServerWorker = worker;
    this.httpServer = wrap<LocalServer>(nodeEndpoint.default(worker));
    this.httpServerStatus = 'starting';

    const port = await this.httpServer.start();

    this.httpServerStatus = 'online';

    return { port };
  }

  async toggleHttpServer(enable: boolean) {
    if (enable) {
      return this.startServer();
    } else {
      await this.terminateServer();
      return null;
    }
  }

  getLang() {
    // todo: normalize return value
    return electronApp.getSystemLocale();
  }
}
