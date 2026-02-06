import { createServer } from 'vite';
import path from 'node:path';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import solid from 'vite-plugin-solid';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from '@tailwindcss/vite';

import { RUNTIME_ENV } from './constants.js';
import { APP_NAME } from '../../../src/domain/shared/infra/constants.js';

const WEB_TSCONFIG = path.resolve('./tsconfig.web.json');

export default async function createViteServer() {
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: path.resolve('./src/driver/client/web'),
    publicDir: path.resolve('./dist/static'),
    esbuild: { target: 'es2023' }, // 用了 ES Decorator，编译到 ESNext 浏览器还不支持
    plugins: [
      solid(),
      checker({ typescript: { tsconfigPath: WEB_TSCONFIG } }),
      tsconfigPaths({ projects: [WEB_TSCONFIG] }),
      tailwindcss(),
      nodePolyfills({
        include: ['process'], // assert 库在依赖这个 polyfill
      }),
    ],
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(APP_NAME),
      'import.meta.env.VITE_WEB_ROOT_ID': JSON.stringify('app'),
      'import.meta.env.VITE_WEB_PLATFORM': JSON.stringify('electron'),
      'import.meta.env.RUNTIME_ENV': JSON.stringify(RUNTIME_ENV),
    },
  });

  await server.listen();
  server.printUrls();

  return server;
}
