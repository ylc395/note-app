const path = require('node:path');
const { build } = require('vite');
const { checker } = require('vite-plugin-checker');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { copyFileSync, ensureDirSync } = require('fs-extra');
const chokidar = require('chokidar');

const outDir = path.resolve('dist/webExtension');
const tsconfigPath = path.resolve('src/webExtension/tsconfig.json');
const manifest = './src/webExtension/manifest.json';
const plugins = [checker({ typescript: { tsconfigPath } }), tsconfigPaths({ projects: [tsconfigPath] })];

const COMMON_BUILD_OPTIONS = {
  minify: false,
  sourcemap: true,
  watch: true,
};

ensureDirSync(outDir);

chokidar.watch(manifest).on('all', () => {
  copyFileSync(manifest, path.join(outDir, 'manifest.json'));
  console.log('copy manifest');
});

build({
  root: 'src/webExtension/content',
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: 'index.ts',
      fileName: () => 'content-script.js',
      name: 'clipper', // meaningless but required
      formats: ['iife'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  plugins,
});

build({
  root: 'src/webExtension/popup',
  base: './', // use relative path to load script
  build: {
    emptyOutDir: true,
    outDir: path.join(outDir, 'popup'),
    ...COMMON_BUILD_OPTIONS,
  },
  plugins,
});
