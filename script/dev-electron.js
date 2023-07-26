const path = require('node:path');
const { createServer, build } = require('vite');
const shell = require('shelljs');
const chokidar = require('chokidar');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { replaceTscAliasPaths } = require('tsc-alias');
const { checker } = require('vite-plugin-checker');
const { parse: parseTsconfig } = require('tsconfck');
const debounce = require('lodash/debounce');

const CLIENT_TSCONFIG = path.resolve('src/client/tsconfig.json');
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
        entry: 'src/client/driver/electron/preload.ts',
        fileName: () => 'preload.js',
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
  if (!options?.skipBuildTs) {
    const result = shell.exec(BUILD_ELECTRON_COMMAND);

    if (result.code > 0) {
      return;
    }
  }

  await replaceTscAliasPaths({
    configFile: 'src/server/tsconfig.json',
    outDir: path.join(ELECTRON_OUTPUT, 'server'),
  });
  await replaceTscAliasPaths({ configFile: CLIENT_TSCONFIG, outDir: path.join(ELECTRON_OUTPUT, 'client') });

  if (options?.bootstrap !== false) {
    const electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/bootstrap.desktop.js`, { async: true });
    return electronProcess;
  }
}

async function createViteServer() {
  const WEB_TSCONFIG = path.resolve(process.cwd(), 'src/client/tsconfig.web.json');
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: './src/client/driver/web',
    plugins: [checker({ typescript: { tsconfigPath: WEB_TSCONFIG } }), tsconfigPaths({ projects: [CLIENT_TSCONFIG] })],
    define: {
      __ENV__: JSON.stringify('dev'),
      __PLATFORM__: JSON.stringify('electron'),
    },
    esbuild: {
      jsxInject: `import React from 'react'`,
      tsconfigRaw: (await parseTsconfig(WEB_TSCONFIG)).tsconfig,
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
    shell.env['NODE_ENV'] = 'development';
    shell.env['APP_PLATFORM'] = 'electron';
    shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';

    await buildPreload();
    let electronProcess = await buildElectron();

    if (electronProcess) {
      shell.exec(`${BUILD_ELECTRON_COMMAND} --watch`, { async: true });

      chokidar.watch(ELECTRON_OUTPUT, { ignoreInitial: true, ignored: [/\.tsbuildinfo$/, /\.map$/, /\.d\.ts$/] }).on(
        'all',
        debounce(async (event, path) => {
          shell.exec('clear');
          console.log(path, event);
          electronProcess.kill();
          shell.env['DEV_CLEAN'] = '0';
          electronProcess = await buildElectron(true);
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
