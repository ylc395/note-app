import createViteServer from './create-vite-server.js';
import buildPreload from './build-preload.js';
import buildMain from './build-main.js';

await buildPreload();

const viteServer = await createViteServer();
const viteUrl = viteServer.resolvedUrls.local[0];

try {
  await buildMain(viteUrl);
} catch (error) {
  console.error(error);
  await viteServer.close();
}
