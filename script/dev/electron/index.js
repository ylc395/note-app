import createViteServer from './create-vite-server.js';
import buildPreload from './build-preload.js';
import buildMain from './build-main.js';

await buildPreload();

// const viteServer = await createViteServer();
const electronProcess = await buildMain();

// if (!electronProcess) {
//   await viteServer.close();
// }
