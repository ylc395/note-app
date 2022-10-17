const path = require('path');
const { createServer, build } = require('vite');
const pluginVue = require('@vitejs/plugin-vue');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { replaceTscAliasPaths } = require('tsc-alias');

const ELECTRON_OUTPUT = 'dist/electron';
const ELECTRON_SERVER_TSCONFIG = 'src/server/tsconfig.electron.json';
const ELECTRON_CLIENT_TSCONFIG = 'src/client/tsconfig.electron.json';
const CLIENT_TSCONFIG = 'src/client/tsconfig.json';
const ELECTRON_RELATED_DIRS = ['src/server', 'src/client/driver/electron', 'src/shared'];

async function buildElectron(viteUrl) {
  // preload script must be processed by a bundler, since `require` doesn't work
  // @see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
  await build({
    build: {
      minify: false,
      sourcemap: true,
      emptyOutDir: false,
      outDir: path.resolve(ELECTRON_OUTPUT, 'client/driver/electron'),
      lib: {
        entry: 'src/client/driver/electron/preload.ts',
        fileName: () => 'preload.js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
    plugins: [tsconfigPaths({ projects: [path.resolve(process.cwd(), CLIENT_TSCONFIG)] })],
  });
  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
  shell.env['NODE_ENV'] = 'development';
  shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';

  shell.exec(`tsc --build ${ELECTRON_SERVER_TSCONFIG} ${ELECTRON_CLIENT_TSCONFIG}`); // have to use build mode to get a correct dir structure
  replaceTscAliasPaths({ configFile: ELECTRON_SERVER_TSCONFIG });
  let electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/driver/electron/index.js`, { async: true });

  return electronProcess;
}

async function createViteServer() {
  const server = await createServer({
    configFile: false,
    root: './src/client/driver/web',
    plugins: [
      pluginVue(),
      tsconfigPaths({
        projects: [path.resolve(process.cwd(), CLIENT_TSCONFIG)],
        loose: true,
      }),
    ],
    define: {
      __WEB_ENV__: JSON.stringify('electron-renderer'),
    },
  });

  await server.listen();
  server.printUrls();

  return server.resolvedUrls.local[0];
}

(async () => {
  const viteUrl = await createViteServer();
  let shellProcess = await buildElectron(viteUrl);

  chokidar.watch(ELECTRON_RELATED_DIRS, { ignoreInitial: true }).on('all', async (event, path) => {
    console.log(path, event);
    shellProcess.kill();
    shellProcess = await buildElectron(viteUrl);
  });
})();
