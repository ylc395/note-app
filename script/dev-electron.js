const path = require('path');
const { createServer } = require('vite');
const pluginVue = require('@vitejs/plugin-vue');
const shell = require('shelljs');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');

const CLIENT_TSCONFIG = 'src/client/tsconfig.json';
const ELECTRON_OUTPUT = 'dist/electron';
const ELECTRON_FLAG = `--project ${CLIENT_TSCONFIG} --outDir ${ELECTRON_OUTPUT} --module commonjs`;

(async () => {
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

  shell.env['VITE_SERVER_ENTRY_URL'] = server.resolvedUrls.local[0];
  shell.exec(`tsc ${ELECTRON_FLAG}`);
  shell.exec(`electron ${ELECTRON_OUTPUT}/index.js`, { async: true });
  shell.exec(`tsc ${ELECTRON_FLAG} --watch`, { async: true });
})();
