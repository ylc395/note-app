import shell from 'shelljs';

import { ENV } from './constants.js';
import createViteServer from './create-vite-server.js';
import buildPreload from './build-preload.js';
import buildElectron from './build-electron.js';

const viteServer = await createViteServer();

shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';
shell.env['NODE_ENV'] = ENV;

await buildPreload();
let electronProcess = await buildElectron({ compile: true, bootstrap: true });

if (!electronProcess) {
  await viteServer.close();
}
