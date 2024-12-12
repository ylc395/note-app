import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import shell from 'shelljs';
import { mapValues, first } from 'lodash-es';

import { RUNTIME_ENV, ELECTRON_TSCONFIG, ELECTRON_TSCONFIG_PATH } from './constants.js';

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
    const paths = ELECTRON_TSCONFIG.compilerOptions.paths;
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
  const compileResult = shell.exec(`tsc --project ${ELECTRON_TSCONFIG_PATH}`);

  if (compileResult.code > 0) {
    throw new Error('compile electron error');
  }

  // 把 import.meta.env 批量换成 process.env
  shell.exec(
    `find ${ELECTRON_TSCONFIG.compilerOptions.outDir} -type f -name "*.js" -exec sed -i '' "s/import\\.meta\\.env/process.env/g" {} +`,
  );

  createPackageJson();
  await downloadSqliteTokenizer();

  shell.env['VITE_SERVER_ENTRY_URL'] = viteUrl;
  shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';
  shell.env['RUNTIME_ENV'] = RUNTIME_ENV;

  const electronProcess = shell.exec(
    `electron ${ELECTRON_TSCONFIG.compilerOptions.outDir}/driver/server/runtime/Electron/bootstrap.js --trace-warnings`,
    { async: true },
  );

  return electronProcess;
}
