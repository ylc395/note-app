import { createServer } from 'vite';
import path from 'node:path';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

import { ENV } from './constants.js';
const WEB_TSCONFIG = path.resolve('./tsconfig.web.json');

export default async function createViteServer() {
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: path.resolve('./src/driver/client/web'),
    esbuild: { target: 'es2023' },
    css: {
      postcss: {
        plugins: [tailwindcss({ config: path.resolve('./src/driver/client/web/tailwind.config.js') })],
      },
    },
    plugins: [react(), checker({ typescript: { tsconfigPath: WEB_TSCONFIG } }), tsconfigPaths(WEB_TSCONFIG)],
    define: {
      'process.env.NODE_ENV': JSON.stringify(ENV),
      __WEB_ENV__: JSON.stringify('electron'),
    },
  });

  await server.listen();
  server.printUrls();

  return server;
}
