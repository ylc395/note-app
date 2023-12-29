import path from 'node:path';
import { createServer, build } from 'vite';
import shell from 'shelljs';
import chokidar from 'chokidar';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import { replaceTscAliasPaths } from 'tsc-alias';
import { debounce } from 'lodash-es';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import downloadSqliteTokenizer from './download-sqlite-tokenizer.js';
import { fileURLToPath } from 'node:url';

const ENV = 'development';

const rootDir = 'src/client';
const WEB_TSCONFIG = path.resolve(`${rootDir}/tsconfig.web.json`);
const PRELOAD_TSCONFIG = path.resolve(`${rootDir}/tsconfig.preload.json`);
const ELECTRON_OUTPUT = 'dist/electron';
const BUILD_ELECTRON_COMMAND = 'tsc --build ./tsconfig.electron.json';

async function buildPreload() {
  // preload script must be processed by a bundler(`vite build` here), since `require` doesn't work
  // @see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
  await build({
    build: {
      minify: false,
      sourcemap: true,
      emptyOutDir: false,
      outDir: path.resolve(ELECTRON_OUTPUT, 'client/driver/electron'),
      lib: {
        entry: `${rootDir}/driver/electron/preload/index.ts`,
        fileName: () => 'preload.js',
        // preload script doesn't support esm
        // https://github.com/electron/electron/blob/main/docs/tutorial/esm.md#sandboxed-preload-scripts-cant-use-esm-imports
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['electron'],
      },
    },
    plugins: [
      checker({ typescript: { tsconfigPath: PRELOAD_TSCONFIG } }),
      tsconfigPaths({ projects: [PRELOAD_TSCONFIG] }),
    ],
  });
}

export async function buildElectron(options) {
  // 1. compile
  if (options?.compile) {
    const result = shell.exec(BUILD_ELECTRON_COMMAND);

    if (result.code > 0) {
      throw new Error('compile electron error');
    }
  }

  // 2. replace ts path
  await replaceTscAliasPaths({ configFile: 'src/server/tsconfig.json', outDir: path.join(ELECTRON_OUTPUT, 'server') });
  await replaceTscAliasPaths({ configFile: 'src/shared/tsconfig.json', outDir: path.join(ELECTRON_OUTPUT, 'shared') });

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
      checker({ typescript: { tsconfigPath: WEB_TSCONFIG, buildMode: true } }),
      tsconfigPaths({ projects: [WEB_TSCONFIG] }),
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    const viteServer = await createViteServer();
    const viteUrl = viteServer.resolvedUrls.local[0];

    shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
    shell.env['NODE_ENV'] = ENV;
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
