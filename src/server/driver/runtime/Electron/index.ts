import { app as electronApp, ipcMain, BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { container } from 'tsyringe';
import { createIPCHandler } from 'electron-trpc/main';

import { IS_DEV } from '@domain/infra/constants.js';
import { token as loggerToken } from '@domain/infra/logger.js';
import { routers } from '@controller/index.js';
import UI, { UI_CHANNEL } from './UI.js';
import DesktopRuntime from '../Desktop.js';

const INDEX_URL = process.env.VITE_SERVER_ENTRY_URL!;
const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default class ElectronRuntime extends DesktopRuntime {
  private mainWindow?: BrowserWindow;
  private ui = new UI();
  protected readonly logger = container.resolve(loggerToken);

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

    ipcMain.handle(UI_CHANNEL, this.handleUI);

    await this.whenReady();
    this.initWindow();
  }

  protected async whenUIReady() {
    await Promise.all([
      this.installDevExtension(),
      new Promise<void>((resolve) => electronApp.on('ready', () => resolve())),
    ]);
  }

  private readonly handleUI = (e: IpcMainInvokeEvent, payload: unknown) => {
    this.ui.ipcEvent = e;
    const isValid = (str: string): str is keyof UI => str in this.ui;

    assert(UI.isValidPayload(payload));
    assert(isValid(payload.funcName));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.ui[payload.funcName] as any)(...payload.args);
  };

  private async installDevExtension() {
    if (!IS_DEV) {
      return;
    }

    try {
      this.logger.debug('try to install devtool');
      const devToolName = await installExtension.default(REACT_DEVELOPER_TOOLS);
      this.logger.debug(`${devToolName} installed`);
    } catch (error) {
      this.logger.error(error);
    }
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

    createIPCHandler({ windows: [this.mainWindow], router: routers });

    if (IS_DEV) {
      await this.mainWindow.loadURL(INDEX_URL);
      this.mainWindow.webContents.openDevTools();
    }
  }
}
