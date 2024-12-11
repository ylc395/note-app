import { createServer } from 'vite';
import path from 'node:path';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

import { ENV } from './constants.js';
import { APP_NAME, WEB_ROOT_ID } from '../../../src/domain/shared/infra/constants.js';

const WEB_TSCONFIG = path.resolve('./tsconfig.web.json');

export default async function createViteServer() {
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: path.resolve('./src/driver/client/web'),
    esbuild: { target: 'es2023' }, // 用了 ES Decorator，编译到 ESNext 浏览器还不支持
    css: {
      postcss: {
        plugins: [tailwindcss({ config: path.resolve('./src/driver/client/web/tailwind.config.js') })],
      },
    },
    plugins: [
      react(),
      checker({ typescript: { tsconfigPath: WEB_TSCONFIG } }),
      tsconfigPaths({ projects: [WEB_TSCONFIG] }),
    ],
    define: {
      'import.meta.env.VITE_APP_NAME': JSON.stringify(APP_NAME),
      'import.meta.env.VITE_WEB_ROOT_ID': JSON.stringify(WEB_ROOT_ID),
      'import.meta.env.VITE_WEB_ENV': JSON.stringify('electron'),
      'import.meta.env.NODE_ENV': JSON.stringify(ENV),
    },
  });

  await server.listen();
  server.printUrls();

  return server;
}
