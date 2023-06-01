const path = require('node:path');
const { build } = require('vite');
const { checker } = require('vite-plugin-checker');
const { viteStaticCopy } = require('vite-plugin-static-copy');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');

const outDir = path.resolve('dist/webExtension');
const tsconfigPath = path.resolve('src/webExtension/tsconfig.json');

build({
  root: 'src/webExtension',
  build: {
    minify: false,
    emptyOutDir: true,
    sourcemap: true,
    outDir,
    lib: {
      entry: 'content/index.ts',
      fileName: () => 'content-script.js',
      formats: ['es'],
    },
    watch: { clearScreen: true },
  },
  plugins: [
    checker({ typescript: { tsconfigPath } }),
    tsconfigPaths({ projects: [tsconfigPath] }),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve('./src/webExtension/manifest.json'),
          dest: '.',
        },
      ],
    }),
  ],
});
