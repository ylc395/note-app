import shell from 'shelljs';
import { copy } from 'fs-extra';
import createViteServer from './create-vite-server.js';
import buildPreload from './build-preload.js';
import buildMain from './build-main.js';

const viteServer = await createViteServer();
const viteUrl = viteServer.resolvedUrls.local[0];

try {
  await buildPreload();
  await buildMain(viteUrl);
  await copy('./node_modules/pdfjs-dist/cmaps', './dist/static/cmaps');
} catch (error) {
  console.error(error);
  await viteServer.close();
}

shell.exec('electron ./dist/driver/server/runtime/Electron/bootstrap.js', { async: true });
