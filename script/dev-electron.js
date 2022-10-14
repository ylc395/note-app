const path = require('path');
const { createServer, build } = require('vite');
const pluginVue = require('@vitejs/plugin-vue');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');

const WEB_TSCONFIG = 'src/client/driver/web/tsconfig.json';

const ELECTRON_OUTPUT = 'dist/electron';
const ELECTRON_TSCONFIG = 'src/server/driver/electron/tsconfig.json';
const PATH_TSCONFIG = 'src/server/tsconfig.json';
const ELECTRON_TS_FLAG = `--project ${ELECTRON_TSCONFIG} --outDir ${ELECTRON_OUTPUT}`;
const ELECTRON_RELATED_DIRS = ['src/server', 'src/client/driver/electron', 'src/shared'];

function callShell(viteUrl) {
  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
  shell.env['NODE_ENV'] = 'development';

  shell.exec(`tsc ${ELECTRON_TS_FLAG}`);
  shell.exec(`resolve-tspaths --project ${PATH_TSCONFIG} --out ${ELECTRON_OUTPUT}`);
  let electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/driver/electron/index.js`, { async: true });

  return electronProcess;
}

(async () => {
  await build({
    build: {
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
  });
  const server = await createServer({
    configFile: false,
    root: './src/client/driver/web',
    plugins: [
      pluginVue(),
      tsconfigPaths({
        projects: [path.resolve(process.cwd(), WEB_TSCONFIG)],
        loose: true,
      }),
    ],
    define: {
      __WEB_ENV__: JSON.stringify('electron-renderer'),
    },
  });

  await server.listen();
  server.printUrls();

  let shellProcess = callShell(server.resolvedUrls.local[0]);

  chokidar.watch(ELECTRON_RELATED_DIRS, { ignoreInitial: true }).on('all', (event, path) => {
    console.log(path, event);
    shellProcess.kill();
    shellProcess = callShell(server.resolvedUrls.local[0]);
  });
})();
