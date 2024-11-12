import { createServer } from 'vite';
import path from 'node:path';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from 'tailwindcss';

import { ENV } from './constants.js';
const WEB_TSCONFIG = path.resolve('./src/driver/client/web/tsconfig.json');

export default async function createViteServer() {
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: './src/driver/client/web',
    css: {
      postcss: {
        plugins: [tailwindcss({ config: path.resolve('./src/driver/client/web/tailwind.config.js') })],
      },
    },
    plugins: [
      react({ tsDecorators: true }), // use this plugin to speed up react compiling and enjoy "fast refresh"
      checker({ typescript: { tsconfigPath: WEB_TSCONFIG } }),
      tsconfigPaths(),
      nodePolyfills(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(ENV),
    },
  });

  await server.listen();
  server.printUrls();

  return server;
}
