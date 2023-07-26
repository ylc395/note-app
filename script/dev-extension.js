const path = require('node:path');
const { build } = require('vite');
const { checker } = require('vite-plugin-checker');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { copyFileSync, emptyDirSync } = require('fs-extra');
const chokidar = require('chokidar');

const outDir = path.resolve('dist/webExtension');
const tsconfigPath = path.resolve('src/webExtension/tsconfig.json');
const manifest = './src/webExtension/manifest.json';

const define = {
  'process.env.NODE_ENV': JSON.stringify('development'),
};

const getPlugins = () => [checker({ typescript: { tsconfigPath } }), tsconfigPaths({ projects: [tsconfigPath] })];

const COMMON_BUILD_OPTIONS = {
  minify: false,
  sourcemap: true,
  watch: true,
};

emptyDirSync(outDir);

chokidar.watch(manifest).on('all', () => {
  copyFileSync(manifest, path.join(outDir, 'manifest.json'));
  console.log('copy manifest');
});

build({
  mode: 'development',
  build: {
    outDir,
    emptyOutDir: false,
    lib: {
      entry: 'src/webExtension/driver/background.ts',
      fileName: () => 'background.js',
      formats: ['es'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  plugins: getPlugins(),
  define,
});

const CONTENT_SCRIPT_DIR = 'src/webExtension/driver/contentScript';

build({
  mode: 'development',
  build: {
    outDir: path.join(outDir, 'content-script'),
    emptyOutDir: false,
    lib: {
      entry: `${CONTENT_SCRIPT_DIR}/index.tsx`,
      fileName: () => 'index.js',
      name: 'clipper', // meaningless but required
      formats: ['iife'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  // when using lib mode, we should set css options manually
  css: {
    postcss: `${CONTENT_SCRIPT_DIR}/postcss.config.js`,
  },
  plugins: getPlugins(),
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
  plugins: getPlugins(),
  define,
});
