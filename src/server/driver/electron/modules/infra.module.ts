import { Global, Module, Inject, type OnModuleInit } from '@nestjs/common';

import { searchEngineFactory, dbFactory, kvDbFactory } from 'driver/sqlite';
import { token as appClientToken, type AppClient, EventNames as AppClientEventNames } from 'infra/appClient';
import { token as databaseToken, type Database } from 'infra/database';
import { token as downloaderToken } from 'infra/downloader';
import { token as syncTargetFactoryToken } from 'infra/synchronizer';
import { type SearchEngine, token as searchEngineToken } from 'infra/searchEngine';
import { type KvDatabase, token as kvDatabaseToken } from 'infra/kvDatabase';

import Downloader from '../infra/Downloader';
import syncTargetFactory from '../infra/syncTargetFactory';
import { registerProtocol } from '../infra/urlProtocol';
import electronClientFactory from '../infra/electronClientFactory';

@Global()
@Module({
  providers: [
    { provide: appClientToken, useFactory: electronClientFactory },
    { provide: databaseToken, useFactory: dbFactory },
    { provide: downloaderToken, useClass: Downloader },
    { provide: searchEngineToken, useFactory: searchEngineFactory },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
    { provide: kvDatabaseToken, useFactory: kvDbFactory },
  ],
  exports: [appClientToken, databaseToken, downloaderToken, syncTargetFactoryToken, searchEngineToken, kvDatabaseToken],
})
export default class InfraModule implements OnModuleInit {
  constructor(
    @Inject(appClientToken) private readonly electronApp: AppClient,
    @Inject(databaseToken) private readonly db: Database,
    @Inject(searchEngineToken) private readonly searchEngine: SearchEngine,
    @Inject(kvDatabaseToken) private readonly kvDb: KvDatabase,
  ) {}

  async onModuleInit() {
    this.electronApp.once(AppClientEventNames.Ready, () => registerProtocol(this.db));

    await this.db.init({ dir: this.electronApp.getDataDir() });
    await this.kvDb.init();
    await this.searchEngine.init();
  }
}
