import { app as electronApp, ipcMain, BrowserWindow, type IpcMainInvokeEvent, protocol } from 'electron';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { container } from 'tsyringe';
import { createIPCHandler } from 'electron-trpc/main';

import { IS_DEV } from '@domain/shared/infra/constants.js';
import { token as loggerToken } from '@domain/shared/infra/logger.js';
import FileService from '@domain/server/service/FileService/index.js';
import { PROTOCOL, parseAppUrl } from '@domain/shared/infra/markdown/url.js';

import UI, { UI_CHANNEL } from './UI.js';
import { routers } from '../../api/index.js';
import DesktopRuntime from '../Desktop.js';

const INDEX_URL = process.env.VITE_SERVER_ENTRY_URL!;
const DIRNAME = path.dirname(fileURLToPath(import.meta.url));

export default class ElectronRuntime extends DesktopRuntime {
  private mainWindow?: BrowserWindow;
  private readonly ui = new UI();
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
    ipcMain.handle(UI_CHANNEL, this.handleUI);

    await electronApp.whenReady();
    protocol.handle(PROTOCOL, this.protocolHandler); // 这个必须在 whenReady 后

    await Promise.all([this.installDevExtension(), this.componentsReady()]);
    this.initWindow();
  }

  private readonly protocolHandler = async (req: GlobalRequest) => {
    const parsed = parseAppUrl(req.url);

    if (!parsed || parsed.type !== 'files') {
      return new Response(null, { status: 404 });
    }

    const data = await this.fileService.queryFileBlobById(parsed.id);

    return new Response(data);
  };

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
        preload: path.resolve(DIRNAME, '../../../client/electron/preload.js'),
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
