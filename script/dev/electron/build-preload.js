import path from 'node:path';
import { build } from 'vite';
import { checker } from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import { CLIENT_ROOT_DIR, ELECTRON_OUTPUT } from './constants.js';

export default async function buildPreload() {
  const PRELOAD_TSCONFIG = path.resolve(`${CLIENT_ROOT_DIR}/tsconfig.preload.json`);

  // preload script must be processed by a bundler(`vite build` here), since `require` doesn't work
  // @see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
  await build({
    build: {
      minify: false,
      sourcemap: true,
      emptyOutDir: false,
      outDir: path.resolve(ELECTRON_OUTPUT, 'client/driver/electron'),
      lib: {
        entry: `${CLIENT_ROOT_DIR}/driver/electron/preload/index.ts`,
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
