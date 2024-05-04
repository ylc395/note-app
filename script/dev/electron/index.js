import createViteServer from './create-vite-server.js';
import buildPreload from './build-preload.js';
import buildElectron from './build-electron.js';

await buildPreload();

const viteServer = await createViteServer();
const electronProcess = await buildElectron({ compile: true, bootstrap: true });

if (!electronProcess) {
  await viteServer.close();
}
