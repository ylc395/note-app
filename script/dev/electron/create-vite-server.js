import { createServer } from 'vite';
import path from 'node:path';
import shell from 'shelljs';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from 'tailwindcss';

import { ENV } from './constants.js';
const WEB_TSCONFIG = path.resolve('./tsconfig.electron.web.json');

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
      tsconfigPaths({ projects: [WEB_TSCONFIG] }),
      nodePolyfills(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(ENV),
    },
  });

  await server.listen();
  server.printUrls();
  const viteUrl = server.resolvedUrls.local[0];
  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;

  return server;
}
