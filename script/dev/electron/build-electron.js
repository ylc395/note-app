import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import shell from 'shelljs';
import { replaceTscAliasPaths } from 'tsc-alias';

import { OUTPUT, ENV } from './constants.js';

const ELECTRON_TSCONFIG = './src/driver/server/runtime/Electron/tsconfig.json';
const BUILD_ELECTRON_COMMAND = `tsc --project ${ELECTRON_TSCONFIG}`;

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

export default async function buildElectron(options) {
  // 1. compile
  if (options?.compile) {
    const result = shell.exec(BUILD_ELECTRON_COMMAND);

    if (result.code > 0) {
      throw new Error('compile electron error');
    }
  }

  // 2. replace ts path
  await replaceTscAliasPaths({ configFile: ELECTRON_TSCONFIG, outDir: OUTPUT });

  await downloadSqliteTokenizer();

  // 3. bootstrap electron process
  if (options?.bootstrap) {
    shell.env['DEV_CLEAN'] = process.argv.includes('--clean') ? '1' : '0';
    shell.env['NODE_ENV'] = ENV;
    const electronProcess = shell.exec(`electron ${OUTPUT}/driver/server/runtime/Electron/bootstrap.js`, {
      async: true,
    });

    return electronProcess;
  }
}
