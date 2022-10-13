import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { ensureDirSync } from 'fs-extra';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV || 'development';

export default class App {
  readonly #electronApp = app;
  #mainWindow?: BrowserWindow;

  constructor() {
    const dir = this.getConfigDir();
    ensureDirSync(dir);
    console.log(`electron: initialized in ${dir}`);
  }

  async start() {
    if (NODE_ENV === 'development') {
      if (process.platform === 'win32') {
        process.on('message', (data) => {
          if (data === 'graceful-exit') {
            this.#electronApp.quit();
          }
        });
      } else {
        process.on('SIGTERM', () => {
          this.#electronApp.quit();
        });
      }
    }

    // https://www.electronjs.org/docs/latest/api/app#event-window-all-closed
    this.#electronApp.on('window-all-closed', () => {
      this.#electronApp.quit();
    });

    await this.#initWindow();
  }

  readonly getConfigDir = () => {
    return join(this.#electronApp.getPath('appData'), APP_NAME);
  };

  async #initWindow() {
    this.#mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
      },
    });

    this.#mainWindow.on('closed', () => {
      this.#mainWindow = undefined;
    });

    if (NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.#mainWindow.loadURL(process.env['VITE_SERVER_ENTRY_URL']!);
      this.#mainWindow.webContents.openDevTools();
    }
  }
}
