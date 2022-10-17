import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';

import MaterialsController from 'controller/MaterialsController';
import { type Database, token as databaseToken } from 'infra/Database';
import { token as fileReaderToken } from 'infra/FileReader';
import { token as localClientToken, type LocalClient } from 'infra/LocalClient';

import MaterialService from 'service/MaterialService';
import SqliteDb from 'driver/sqlite';
import FileReader from 'driver/fs';
import ElectronApp from 'client/driver/electron';

@Module({
  controllers: [MaterialsController],
  providers: [
    { provide: databaseToken, useClass: SqliteDb },
    { provide: fileReaderToken, useClass: FileReader },
    { provide: localClientToken, useClass: ElectronApp },
    MaterialService,
  ],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(
    @Inject(databaseToken) private readonly db: Database,
    @Inject(localClientToken) private readonly electronApp: LocalClient,
  ) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await this.db.init(configDir);
    await this.electronApp.start();
  }
}
