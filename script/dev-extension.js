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

const define = {
  'process.env.NODE_ENV': JSON.stringify('development'),
};

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
  root: 'src/webExtension',
  mode: 'development',
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: 'driver/background.ts',
      fileName: () => 'background.js',
      formats: ['es'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  plugins,
  define,
});

build({
  root: 'src/webExtension',
  mode: 'development',
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: 'driver/contentScript.ts',
      fileName: () => 'content-script.js',
      name: 'clipper', // meaningless but required
      formats: ['iife'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  plugins,
  define,
});

build({
  root: 'src/webExtension/driver/popup',
  mode: 'development',
  base: './', // use relative path to load script
  build: {
    emptyOutDir: true,
    outDir: path.join(outDir, 'popup'),
    ...COMMON_BUILD_OPTIONS,
  },
  plugins,
  define,
});
