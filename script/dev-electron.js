const { createServer } = require('vite');
const shell = require('shelljs');

const ELECTRON_TSCONFIG = 'src/client/tsconfig.electron.json';
const ELECTRON_OUTPUT = 'dist/desktop';

(async () => {
  const server = await createServer({
    configFile: false,
    root: './src/client/driver/web',
  });

  await server.listen();
  server.printUrls();

  shell.env['VITE_SERVER_ENTRY_URL'] = server.resolvedUrls.local[0];
  shell.exec(`tsc --project ${ELECTRON_TSCONFIG} --outDir ${ELECTRON_OUTPUT}`);
  shell.exec(`electron ${ELECTRON_OUTPUT}/electron/index.js`, { async: true });
  shell.exec(
    `tsc --project ${ELECTRON_TSCONFIG} --watch --outDir ${ELECTRON_OUTPUT}`,
    { async: true },
  );
})();
