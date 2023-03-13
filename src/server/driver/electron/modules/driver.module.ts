import { Global, Module, Inject, type OnApplicationBootstrap } from '@nestjs/common';
import { protocol } from 'electron';
import { parse as parseUrl } from 'node:url';
import { basename } from 'node:path';

import FileReader from 'driver/fs';
import Sqlite from 'driver/sqlite';
import ElectronClient from 'client/driver/electron';

import { token as appClientToken, type AppClient, Events as AppClientEvents } from 'infra/AppClient';
import { appFileProtocol } from 'infra/protocol';
import { token as fileReaderToken } from 'infra/FileReader';
import { token as databaseToken, type Database } from 'infra/Database';
import type Repositories from 'service/repository';

const drivers = [
  [fileReaderToken, FileReader],
  [appClientToken, ElectronClient],
  [databaseToken, Sqlite],
] as const;

@Global()
@Module({
  providers: drivers.map(([token, driverClass]) => ({ provide: token, useClass: driverClass })),
  exports: drivers.map(([token]) => token),
})
export default class DriverModule implements OnApplicationBootstrap {
  constructor(
    @Inject(appClientToken) private readonly electronApp: AppClient,
    @Inject(databaseToken) private readonly sqliteDb: Database,
  ) {}

  onApplicationBootstrap() {
    this.electronApp.once(AppClientEvents.BeforeStart, () => {
      protocol.registerSchemesAsPrivileged([
        {
          scheme: appFileProtocol,
          privileges: {
            supportFetchAPI: true,
          },
        },
      ]);
    });

    this.electronApp.once(AppClientEvents.Ready, async () => {
      const configDir = this.electronApp.getConfigDir();
      await this.sqliteDb.init(configDir);
      let fileRepository: Repositories['files'];

      protocol.registerBufferProtocol(appFileProtocol, async (req, res) => {
        if (!fileRepository) {
          fileRepository = this.sqliteDb.getRepository('files');
        }

        const { pathname } = parseUrl(req.url);

        if (!pathname) {
          throw new Error('invalid url');
        }

        const fileId = basename(pathname);
        const file = await fileRepository.findFileDataById(fileId);

        if (!file) {
          res({ statusCode: 404 });
        } else {
          res({ data: Buffer.from(file.data), headers: { 'Content-Type': file.mimeType } });
        }
      });
    });
  }
}
