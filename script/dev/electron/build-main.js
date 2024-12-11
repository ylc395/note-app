import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import shell from 'shelljs';
import { mapValues, first } from 'lodash-es';
import { build } from 'esbuild';

import { ENV, TSCONFIG } from './constants.js';

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

function createPackageJson() {
  const getImports = () => {
    const paths = TSCONFIG.compilerOptions.paths;
    return mapValues(paths, (targets) => first(targets).replace('./src', '.'));
  };

  fs.outputJSONSync(
    path.resolve('dist/package.json'),
    {
      type: 'module',
      imports: getImports(),
    },
    { spaces: 2 },
  );
}

export default async function buildMain(viteUrl) {
  const TSCONFIG = './tsconfig.electron.json';
  const typeCheckResult = shell.exec(`tsc --project ${TSCONFIG} --noEmit`);

  if (typeCheckResult.code > 0) {
    return;
  }

  await build({
    tsconfig: TSCONFIG,
    outdir: TSCONFIG.compilerOptions.outDir,
    define: {
      VITE_SERVER_ENTRY_URL: JSON.stringify(viteUrl),
      DEV_CLEAN: JSON.stringify(process.argv.includes('--clean') ? '1' : '0'),
      NODE_ENV: JSON.stringify(ENV),
    },
  });

  createPackageJson();
  await downloadSqliteTokenizer();

  const electronProcess = shell.exec(
    `electron ${TSCONFIG.compilerOptions.outDir}/driver/server/runtime/Electron/bootstrap.js`,
    { async: true },
  );

  return electronProcess;
}
