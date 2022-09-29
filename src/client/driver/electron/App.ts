import { app, BrowserWindow, protocol } from 'electron';

export class App {
  readonly #electronApp = app;
  #mainWindow?: BrowserWindow;
  readonly #env = process.env.NODE_ENV || 'development';

  async start() {
    if (this.#env === 'development') {
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

    await this.#initProtocol();
    await this.#initWindow();
  }

  #initProtocol = async () => {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'electron',
        privileges: {
          supportFetchAPI: true,
          stream: true,
        },
      },
    ]);
    await this.#electronApp.whenReady();
    protocol.registerStringProtocol('electron', (reqeust, res) => {
      console.log(reqeust);
      res({
        data: reqeust.url,
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
        },
      });
    });
  };

  async #initWindow() {
    this.#mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
    });

    this.#mainWindow.on('closed', () => {
      this.#mainWindow = undefined;
    });

    if (this.#env === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.#mainWindow.loadURL(process.env['VITE_SERVER_ENTRY_URL']!);
      this.#mainWindow.webContents.openDevTools();
    }
  }
}
