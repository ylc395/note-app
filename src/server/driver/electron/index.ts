import { app as electronApp, BrowserWindow, ipcMain } from 'electron';
import { Logger, type OnModuleInit } from '@nestjs/common';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { type Remote, wrap, releaseProxy } from 'comlink';
import nodeEndpoint from 'comlink/dist/umd/node-adapter';
import { ensureDir } from 'fs-extra';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import Runtime from 'infra/Runtime';
import { IS_DEV } from 'infra/constants';
import { UI_CHANNEL, UIHandler } from 'client/driver/electron/ui';
import type LocalServer from '../localHttpServer';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const INDEX_URL = process.env.VITE_SERVER_ENTRY_URL!;

process.traceProcessWarnings = IS_DEV;

export default class ElectronRuntime extends Runtime implements OnModuleInit {
  private readonly logger = new Logger('electron app');
  private mainWindow?: BrowserWindow;
  readonly type = 'electron';

  async onModuleInit() {
    const paths = this.getPaths();

    for (const path of Object.values(paths)) {
      await ensureDir(path);
    }
  }

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
        preload: path.resolve(__dirname, '../../../client/driver/electron/preload.js'),
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

    const worker = new Worker(path.resolve(path.dirname(__dirname), '../../server/bootstrap.localServer.js'), {
      workerData: { runtime: 'http' },
    });
    this.httpServerWorker = worker;
    this.httpServer = wrap<LocalServer>(nodeEndpoint(worker));
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
