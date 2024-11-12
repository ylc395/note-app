import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import shell from 'shelljs';
import { get, mapValues, first } from 'lodash-es';

import { OUTPUT, ENV } from './constants.js';

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
    const tsconfig = fs.readJSONSync(path.resolve('tsconfig.json'));
    const paths = get(tsconfig, 'compilerOptions.paths');

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

export default async function buildMain() {
  const BUILD_COMMAND = `tsc --project ./src/driver/server/runtime/Electron/tsconfig.json`;
  const compileResult = shell.exec(BUILD_COMMAND);

  if (compileResult.code > 0) {
    throw new Error('compile electron error');
  }

  createPackageJson();
  await downloadSqliteTokenizer();

  shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';
  shell.env['NODE_ENV'] = ENV;

  const BOOTSTRAP_COMMAND = `electron ${OUTPUT}/driver/server/runtime/Electron/bootstrap.js`;
  const electronProcess = shell.exec(BOOTSTRAP_COMMAND, { async: true });

  return electronProcess;
}
