const path = require('node:path');
const { createServer, build } = require('vite');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { replaceTscAliasPaths } = require('tsc-alias');
const { checker } = require('vite-plugin-checker');
const debounce = require('lodash/debounce');
const react = require('@vitejs/plugin-react-swc');
const { nodePolyfills } = require('vite-plugin-node-polyfills');
const downloadSqliteTokenizer = require('./download-sqlite-tokenizer');

const ENV = 'development';
const APP_PLATFORM = 'electron';

const rootDir = 'src/client/app';
const CLIENT_TSCONFIG = path.resolve(`${rootDir}/tsconfig.json`);
const ELECTRON_OUTPUT = 'dist/electron';
const BUILD_ELECTRON_COMMAND = 'tsc --build ./src/server/tsconfig.electron.json';

async function buildPreload() {
  // preload script must be processed by a bundler(`vite build` here), since `require` doesn't work
  // @see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
  await build({
    build: {
      minify: false,
      sourcemap: true,
      emptyOutDir: false,
      outDir: path.resolve(ELECTRON_OUTPUT, 'client/driver/electronPreload'),
      lib: {
        entry: `${rootDir}/driver/electronPreload/index.ts`,
        fileName: () => 'index.js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
    plugins: [
      checker({ typescript: { tsconfigPath: CLIENT_TSCONFIG } }),
      tsconfigPaths({ projects: [CLIENT_TSCONFIG] }),
    ],
  });
}

async function buildElectron(options) {
  // 1. compile
  if (options?.compile) {
    const result = shell.exec(BUILD_ELECTRON_COMMAND);

    if (result.code > 0) {
      throw new Error('compile electron error');
    }
  }

  // 2. replace ts path
  await replaceTscAliasPaths({
    configFile: 'src/server/tsconfig.json',
    outDir: path.join(ELECTRON_OUTPUT, 'server'),
  });
  await replaceTscAliasPaths({ configFile: CLIENT_TSCONFIG, outDir: path.join(ELECTRON_OUTPUT, 'client') });

  await downloadSqliteTokenizer();

  // 3. bootstrap electron process
  if (options?.bootstrap) {
    const electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/bootstrap.desktop.js`, { async: true });
    return electronProcess;
  }
}

async function createViteServer() {
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: `${rootDir}/driver/web`,
    plugins: [
      react({ tsDecorators: true }), // use this plugin to speed up react compiling and enjoy "fast refresh"
      checker({ typescript: { tsconfigPath: CLIENT_TSCONFIG } }),
      tsconfigPaths({ projects: [CLIENT_TSCONFIG] }),
      nodePolyfills(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(ENV),
      'process.env.APP_PLATFORM': JSON.stringify(APP_PLATFORM),
    },
  });

  await server.listen();
  server.printUrls();

  return server;
}

if (process.argv[1] === __filename) {
  (async () => {
    const viteServer = await createViteServer();
    const viteUrl = viteServer.resolvedUrls.local[0];

    shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
    shell.env['NODE_ENV'] = ENV;
    shell.env['APP_PLATFORM'] = APP_PLATFORM;
    shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';

    await buildPreload();
    let electronProcess = await buildElectron({ compile: true, bootstrap: true });

    if (electronProcess) {
      // this will trigger building again though we only want to enable watch mode. But the cost is cheap since we have .tsbuildinfo
      // see https://github.com/microsoft/TypeScript/issues/12996#issuecomment-522744917
      shell.exec(`${BUILD_ELECTRON_COMMAND} --watch`, { async: true });

      chokidar.watch(ELECTRON_OUTPUT, { ignoreInitial: true, ignored: [/\.tsbuildinfo$/, /\.map$/, /\.d\.ts$/] }).on(
        'all',
        debounce(async (event, path) => {
          shell.exec('clear');
          console.log(path, event);
          electronProcess.kill();
          shell.env['DEV_CLEAN'] = '0';
          electronProcess = await buildElectron({ compile: false, bootstrap: true });
        }, 500),
      );
    } else {
      await viteServer.close();
    }
  })();
}

module.exports = {
  buildElectron,
};
