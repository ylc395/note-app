const path = require('path');
const { createServer, build } = require('vite');
const pluginVue = require('@vitejs/plugin-vue');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { replaceTscAliasPaths } = require('tsc-alias');
const { checker } = require('vite-plugin-checker');
const { parse } = require('tsconfck');

const CLIENT_TSCONFIG = 'src/client/tsconfig.json';
const ELECTRON_OUTPUT = 'dist/electron';

async function buildPreload() {
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
}

async function buildElectron(viteUrl) {
  const ELECTRON_SERVER_TSCONFIG = 'src/server/tsconfig.electron.json';
  const ELECTRON_CLIENT_TSCONFIG = 'src/client/tsconfig.electron.json';

  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
  shell.env['NODE_ENV'] = 'development';
  shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';

  const serverBuildInfo = path.join(ELECTRON_OUTPUT, 'server.tsbuildinfo');
  const clientBuildInfo = path.join(ELECTRON_OUTPUT, 'client.tsbuildinfo');

  const commands = [
    `tsc --project ${ELECTRON_CLIENT_TSCONFIG} --outDir ${ELECTRON_OUTPUT} --tsBuildInfoFile ${clientBuildInfo}`,
    `tsc --project ${ELECTRON_SERVER_TSCONFIG} --outDir ${ELECTRON_OUTPUT} --tsBuildInfoFile ${serverBuildInfo}`,
  ];

  for (const command of commands) {
    const result = shell.exec(command);

    if (result.code > 0) {
      return;
    }
  }

  await replaceTscAliasPaths({ configFile: ELECTRON_SERVER_TSCONFIG, outDir: ELECTRON_OUTPUT });
  let electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/driver/electron/index.js`, { async: true });

  return electronProcess;
}

async function createViteServer() {
  const WEB_TSCONFIG = path.resolve(process.cwd(), 'src/client/tsconfig.web.json');
  const { tsconfig: WEB_RAW_TSCONFIG } = await parse(WEB_TSCONFIG);
  const server = await createServer({
    configFile: false,
    root: './src/client/driver/web',
    plugins: [
      checker({ vueTsc: { tsconfigPath: WEB_TSCONFIG }, overlay: false }),
      pluginVue(),
      tsconfigPaths({
        projects: [path.resolve(process.cwd(), CLIENT_TSCONFIG)],
        loose: true,
      }),
    ],
    define: {
      __WEB_ENV__: JSON.stringify('electron-renderer'),
    },
    esbuild: {
      tsconfigRaw: WEB_RAW_TSCONFIG,
    },
  });

  await server.listen();
  server.printUrls();

  return server.resolvedUrls.local[0];
}

(async () => {
  shell.exec('clear');
  await buildPreload();
  const viteUrl = await createViteServer();
  const ELECTRON_RELATED_DIRS = ['src/server', 'src/client/driver/electron', 'src/shared'];

  let shellProcess = await buildElectron(viteUrl);
  chokidar.watch(ELECTRON_RELATED_DIRS, { ignoreInitial: true }).on('all', async (event, path) => {
    console.log(path, event);
    shellProcess?.kill();
    shellProcess = await buildElectron(viteUrl);
  });
})();
