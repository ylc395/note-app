import { Global, Module, Inject, type OnApplicationBootstrap } from '@nestjs/common';

import { searchEngineFactory, dbFactory } from 'driver/sqlite';
import electronClientFactory from 'client/driver/electron';

import { token as appClientToken, type AppClient, EventNames as AppClientEventNames } from 'infra/AppClient';
import { token as databaseToken, type Database } from 'infra/database';
import { token as downloaderToken } from 'infra/downloader';
import { token as syncTargetFactoryToken } from 'infra/synchronizer';
import { token as searchEngineToken } from 'infra/searchEngine';

import Downloader from '../infra/Downloader';
import syncTargetFactory from '../infra/syncTargetFactory';
import { registerProtocol } from '../infra/urlProtocol';

@Global()
@Module({
  providers: [
    { provide: appClientToken, useFactory: electronClientFactory },
    { provide: databaseToken, useFactory: dbFactory },
    { provide: downloaderToken, useClass: Downloader },
    { provide: searchEngineToken, useFactory: searchEngineFactory },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
  ],
  exports: [appClientToken, databaseToken, downloaderToken, syncTargetFactoryToken, searchEngineToken],
})
export default class InfraModule implements OnApplicationBootstrap {
  constructor(
    @Inject(appClientToken) private readonly electronApp: AppClient,
    @Inject(databaseToken) private readonly sqliteDb: Database,
  ) {}

  async onApplicationBootstrap() {
    this.electronApp.once(AppClientEventNames.Ready, () => registerProtocol(this.sqliteDb));
    await this.sqliteDb.init(this.electronApp.getDataDir());
  }
}
