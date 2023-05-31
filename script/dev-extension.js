const path = require('node:path');
const { build } = require('vite');
const { checker } = require('vite-plugin-checker');
const { viteStaticCopy } = require('vite-plugin-static-copy');

const outDir = path.resolve('dist/webExtension');

build({
  root: 'src/webExtension',
  mode: 'dev',
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
    checker({
      typescript: { tsconfigPath: path.resolve('src/webExtension/tsconfig.json') },
      enableBuild: false,
    }),
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
