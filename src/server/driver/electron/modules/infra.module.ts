import { Global, Module, Inject, type OnApplicationBootstrap } from '@nestjs/common';
import { protocol } from 'electron';

import sqliteFactory from 'driver/sqlite';
import electronClientFactory from 'client/driver/electron';

import { token as appClientToken, type AppClient, Events as AppClientEvents } from 'infra/AppClient';
import { appFileProtocol } from 'infra/electronProtocol';
import { token as databaseToken, type Database } from 'infra/Database';
import { token as downloaderToken } from 'infra/Downloader';
import { token as syncTargetFactoryToken } from 'infra/SyncTargetFactory';
import type Repositories from 'service/repository';
import ResourceService from 'service/ResourceService';

import Downloader from '../infra/Downloader';
import syncTargetFactory from '../infra/syncTargetFactory';

@Global()
@Module({
  providers: [
    { provide: appClientToken, useFactory: electronClientFactory },
    { provide: databaseToken, useFactory: sqliteFactory },
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

  async onApplicationBootstrap() {
    this.electronApp.once(AppClientEvents.Ready, this.registerProtocol.bind(this));
    const configDir = this.electronApp.getConfigDir();
    await this.sqliteDb.init(configDir);
  }

  private registerProtocol() {
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
  }
}
