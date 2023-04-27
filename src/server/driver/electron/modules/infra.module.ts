import { Global, Module, Inject, type OnApplicationBootstrap } from '@nestjs/common';
import { protocol } from 'electron';

import Sqlite from 'driver/sqlite';
import ElectronClient from 'client/driver/electron';

import { token as appClientToken, type AppClient, Events as AppClientEvents } from 'infra/AppClient';
import { appFileProtocol } from 'infra/electronProtocol';
import { token as databaseToken, type Database } from 'infra/Database';
import { token as downloaderToken } from 'infra/Downloader';
import { token as syncTargetFactoryToken } from 'infra/SyncTargetFactory';
import type Repositories from 'service/repository';
import ResourceService from 'service/ResourceService';

import Downloader from '../infra/Downloader';
import syncTargetFactory from '../infra/syncTarget/factory';

@Global()
@Module({
  providers: [
    { provide: appClientToken, useClass: ElectronClient },
    { provide: databaseToken, useClass: Sqlite },
    { provide: downloaderToken, useClass: Downloader },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
  ],
  exports: [appClientToken, databaseToken, downloaderToken, syncTargetFactoryToken],
})
export default class InfraModule implements OnApplicationBootstrap {
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
            stream: true,
          },
        },
      ]);
    });

    this.electronApp.once(AppClientEvents.Ready, async () => {
      const configDir = this.electronApp.getConfigDir();
      await this.sqliteDb.init(configDir);
      let resourceRepository: Repositories['resources'];

      protocol.registerBufferProtocol(appFileProtocol, async (req, res) => {
        if (!resourceRepository) {
          resourceRepository = this.sqliteDb.getRepository('resources');
        }

        const resourceId = ResourceService.getResourceIdFromUrl(req.url);

        if (!resourceId) {
          res({ statusCode: 404 });
          return;
        }

        const file = await resourceRepository.findFileById(resourceId);

        if (!file) {
          res({ statusCode: 404 });
        } else {
          res({ data: Buffer.from(file.data), headers: { 'Content-Type': file.mimeType } });
        }
      });
    });
  }
}
