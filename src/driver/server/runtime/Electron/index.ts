import { app as electronApp, BrowserWindow, protocol } from 'electron';
import { identity } from 'lodash-es';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installExtension, MOBX_DEVTOOLS } from 'electron-devtools-installer';
import { createIPCHandler } from 'electron-trpc/main';

import { PROTOCOL } from '#domain/shared/infra/url.js';
import { IS_DEV } from '#domain/shared/infra/env.js';
import { token as loggerToken } from '#domain/shared/infra/logger.js';
import FileService from '#domain/server/service/FileService/index.js';
import { container } from '#domain/shared/infra/singletons.js';

import DesktopRuntime from '../Desktop.js';
import protocolHandler from './protocolHandler.js';
import router from '../../../client/electron/rpcClient/router.js';

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default class ElectronRuntime extends DesktopRuntime {
  public readonly appName = 'main-app';
  public readonly appVersion = '1.0.0'; // todo: 从某个构建变量里取
  private mainWindow?: BrowserWindow;
  protected readonly logger = container.resolve(loggerToken);
  private readonly fileService = container.resolve(FileService);

  public async bootstrap() {
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

    electronApp.on('window-all-closed', () => {
      electronApp.quit();
    });

    protocol.registerSchemesAsPrivileged([
      {
        scheme: PROTOCOL,
        privileges: {
          stream: true,
          secure: true,
        },
      },
    ]);

    await electronApp.whenReady();
    protocol.handle(PROTOCOL, protocolHandler); // 这个必须在 whenReady 后

    await Promise.all([this.installDevExtension(), this.ready()]);
    this.initWindow();
  }

  private async installDevExtension() {
    if (!IS_DEV) {
      return;
    }

    const extensionIds = [
      MOBX_DEVTOOLS,
      'kmcfjchnmmaeeagadbhoofajiopoceel', // solidjs dev tool, https://chromewebstore.google.com/detail/solid-devtools/kmcfjchnmmaeeagadbhoofajiopoceel
    ];

    for (const id of extensionIds) {
      try {
        const devToolName = await installExtension(id);
        this.logger.debug(`${devToolName.name} installed`);
      } catch (error) {
        this.logger.error(error);
      }
    }
  }

  private async initWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.resolve(DIRNAME, '../../../client/electron/preload.js'),
      },
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = undefined;
    });

    this.mainWindow.webContents.on('will-navigate', (e, url) => {
      // allow reload in dev env
      if (IS_DEV && url === import.meta.env.VITE_SERVER_ENTRY_URL) {
        return;
      }

      this.logger.warn(`prevent from redirect to ${url}`);
      e.preventDefault();
    });

    createIPCHandler({
      router,
      windows: [this.mainWindow],
      createContext: identity,
    });

    if (IS_DEV) {
      await this.mainWindow.loadURL(import.meta.env.VITE_SERVER_ENTRY_URL);
      this.mainWindow.webContents.openDevTools();
    }
  }
}
