import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import { build } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { checker } from 'vite-plugin-checker';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import workerPlugin from './worker-plugin.js';

import { RUNTIME_ENV, ELECTRON_TSCONFIG_PATH } from './constants.js';

async function downloadSqliteTokenizer() {
  const localPath = path.resolve('dist/driver/server/sqlite/simple-tokenizer');
  if (fs.pathExistsSync(localPath)) {
    return;
  }

  var platform = process.env.npm_config_target_platform || process.platform;
  var arch = process.env.npm_config_target_arch || process.arch;

  let downloadUrl = `https://github.com/wangfenjin/simple/releases/latest/download/libsimple-linux-ubuntu-18.04.zip`;
  if (platform === 'darwin') {
    platform = 'osx';
    downloadUrl = `https://github.com/wangfenjin/simple/releases/latest/download/libsimple-osx-x64.zip`;
  } else if (platform === 'win32') {
    platform = 'windows';
    if (arch === 'x64') {
      downloadUrl = `https://github.com/wangfenjin/simple/releases/latest/download/libsimple-windows-x64.zip`;
    } else {
      downloadUrl = `https://github.com/wangfenjin/simple/releases/latest/download/libsimple-windows-x86.zip`;
    }
  }

  console.info(`[install] Target platform: -${platform}-`);
  console.info(`[install] Target arch: ${arch}`);
  console.info(`[install] Download prebuilt binaries from ${downloadUrl} to ${localPath}`);

  await download(downloadUrl, localPath, {
    extract: true,
    strip: 1,
  });

  console.log('[install] done');
}

export default async function buildMain(viteUrl) {
  await downloadSqliteTokenizer();
  await build({
    logLevel: 'warn',
    build: {
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      outDir: './dist',
      lib: {
        fileName: (format, name) => `${name}.js`,
        entry: path.resolve('./src/driver/server/runtime/Electron/bootstrap.ts'),
        formats: ['es'],
      },
      rollupOptions: {
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
    define: {
      'import.meta.env.VITE_SERVER_ENTRY_URL': JSON.stringify(viteUrl),
      'import.meta.env.DEV_CLEAN': JSON.stringify(process.argv.includes('--clean') ? '1' : '0'),
      'import.meta.env.RUNTIME_ENV': JSON.stringify(RUNTIME_ENV),
    },
    plugins: [
      checker({ typescript: { tsconfigPath: ELECTRON_TSCONFIG_PATH } }),
      tsconfigPaths(),
      externalizeDeps(),
      workerPlugin(), // https://github.com/vitejs/vite/pull/3932 等这个 PR 被合并，就无需引入此插件了。到时候顺便把该插件的依赖也移除
    ],
  });
}
