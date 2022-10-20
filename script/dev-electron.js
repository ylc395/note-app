const path = require('path');
const { createServer, build } = require('vite');
const pluginVue = require('@vitejs/plugin-vue');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { replaceTscAliasPaths } = require('tsc-alias');

const CLIENT_TSCONFIG = 'src/client/tsconfig.json';
const ELECTRON_OUTPUT = 'dist/electron';

async function buildPreload() {
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
}

async function buildElectron(viteUrl) {
  const ELECTRON_SERVER_TSCONFIG = 'src/server/tsconfig.electron.json';
  const ELECTRON_CLIENT_TSCONFIG = 'src/client/tsconfig.electron.json';
  // preload script must be processed by a bundler, since `require` doesn't work
  // @see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
  shell.env['NODE_ENV'] = 'development';
  shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';

  const serverBuildInfo = path.join(ELECTRON_OUTPUT, 'server.tsbuildinfo');
  const clientBuildInfo = path.join(ELECTRON_OUTPUT, 'client.tsbuildinfo');
  shell.exec(
    `tsc --project ${ELECTRON_CLIENT_TSCONFIG} --outDir ${ELECTRON_OUTPUT} --tsBuildInfoFile ${clientBuildInfo}`,
  );
  shell.exec(
    `tsc --project ${ELECTRON_SERVER_TSCONFIG} --outDir ${ELECTRON_OUTPUT} --tsBuildInfoFile ${serverBuildInfo}`,
  );
  await replaceTscAliasPaths({ configFile: ELECTRON_SERVER_TSCONFIG, outDir: ELECTRON_OUTPUT });
  let electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/driver/electron/index.js`, { async: true });

  return electronProcess;
}

async function createViteServer() {
  await buildPreload();
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
  const ELECTRON_RELATED_DIRS = ['src/server', 'src/client/driver/electron', 'src/shared'];
  let shellProcess = await buildElectron(viteUrl);

  chokidar.watch(ELECTRON_RELATED_DIRS, { ignoreInitial: true }).on('all', async (event, path) => {
    console.log(path, event);
    shellProcess.kill();
    shellProcess = await buildElectron(viteUrl);
  });
})();
