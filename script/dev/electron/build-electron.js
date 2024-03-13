import path from 'node:path';
import fs from 'fs-extra';
import download from 'download';
import shell from 'shelljs';
import { debounce } from 'lodash-es';
import chokidar from 'chokidar';
import { replaceTscAliasPaths } from 'tsc-alias';

import { ELECTRON_OUTPUT } from './constants.js';

const BUILD_ELECTRON_COMMAND = 'tsc --build ./src/server/tsconfig.electron.json';

async function downloadSqliteTokenizer() {
  const localPath = path.join(process.cwd(), 'dist/electron/server/driver/sqlite/simple-tokenizer');
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
  await replaceTscAliasPaths({ configFile: 'src/server/tsconfig.json', outDir: path.join(ELECTRON_OUTPUT, 'server') });
  await replaceTscAliasPaths({ configFile: 'src/shared/tsconfig.json', outDir: path.join(ELECTRON_OUTPUT, 'shared') });

  await downloadSqliteTokenizer();

  // 3. bootstrap electron process
  if (options?.bootstrap) {
    const electronProcess = shell.exec(`electron ${ELECTRON_OUTPUT}/server/bootstrap.electron.js`, { async: true });

    if (electronProcess) {
      // this will trigger building again though we only want to enable watch mode. But the cost is cheap since we have .tsbuildinfo
      // see https://github.com/microsoft/TypeScript/issues/12996#issuecomment-522744917
      shell.exec(`${BUILD_ELECTRON_COMMAND} --watch`, { async: true });

      chokidar.watch(ELECTRON_OUTPUT, { ignoreInitial: true, ignored: [/\.tsbuildinfo$/, /\.map$/, /\.d\.ts$/] }).on(
        'all',
        debounce(async (event, path) => {
          shell.exec('clear');
          console.log(path, event);
          electronProcess.kill();
          shell.env['DEV_CLEAN'] = '0';
          await buildElectron({ compile: false, bootstrap: true });
        }, 500),
      );
    }

    return electronProcess;
  }
}
