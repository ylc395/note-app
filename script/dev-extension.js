const path = require('node:path');
const { build } = require('vite');
const { checker } = require('vite-plugin-checker');
const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { copyFileSync, emptyDirSync, ensureDirSync } = require('fs-extra');
const chokidar = require('chokidar');
const react = require('@vitejs/plugin-react-swc');
const compact = require('lodash/compact');

const rootDir = 'src/client/webExtension';
const outDir = path.resolve('dist/webExtension');
const contentScriptOutDir = path.join(outDir, 'content-script');
const tsconfigPath = path.resolve(`${rootDir}/tsconfig.json`);
const manifest = path.resolve(`${rootDir}/manifest.json`);
const previewPage = path.resolve(`${rootDir}/driver/contentScript/views/Modal/preview.html`);
const previewPageScript = path.resolve(`${rootDir}/driver/contentScript/views/Modal/preview.js`);

const define = {
  'process.env.NODE_ENV': JSON.stringify('development'),
};

const getPlugins = (useReact) =>
  compact([
    checker({ typescript: { tsconfigPath } }),
    tsconfigPaths({ projects: [tsconfigPath] }),
    useReact && react({ tsDecorators: true }),
  ]);

const COMMON_BUILD_OPTIONS = {
  minify: false,
  sourcemap: true,
  watch: true,
  emptyOutDir: false,
};

emptyDirSync(outDir);
ensureDirSync(contentScriptOutDir);

chokidar.watch(manifest).on('all', () => {
  copyFileSync(manifest, path.join(outDir, 'manifest.json'));
  console.log('copy manifest');
});

chokidar.watch([previewPage, previewPageScript]).on('all', (_, filePath) => {
  const fileName = path.basename(filePath);
  copyFileSync(filePath, path.join(contentScriptOutDir, path.basename(fileName)));
  console.log(`copy ${fileName}`);
});

build({
  mode: 'development',
  build: {
    outDir,
    lib: {
      entry: `${rootDir}/driver/background/index.ts`,
      fileName: () => 'background.js',
      formats: ['es'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  plugins: getPlugins(),
  define,
});

const CONTENT_SCRIPT_DIR = `${rootDir}/driver/contentScript`;

build({
  mode: 'development',
  build: {
    outDir: contentScriptOutDir,
    lib: {
      entry: `${CONTENT_SCRIPT_DIR}/index.tsx`,
      fileName: () => 'index.js',
      name: 'clipper', // meaningless but required
      formats: ['iife'],
    },
    ...COMMON_BUILD_OPTIONS,
  },
  // we should set css options manually since we don't set `root` for building
  css: {
    postcss: `${CONTENT_SCRIPT_DIR}/postcss.config.js`,
  },
  plugins: getPlugins(true),
  define,
});

build({
  root: `${rootDir}/driver/popup`,
  mode: 'development',
  base: './', // use relative path to load script
  build: {
    outDir: path.join(outDir, 'popup'),
    ...COMMON_BUILD_OPTIONS,
  },
  plugins: getPlugins(true),
  define,
});
