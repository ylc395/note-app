import { Global, Module, Inject, type OnApplicationBootstrap } from '@nestjs/common';

import FileReader from 'driver/fs';
import ElectronClient from 'client/driver/electron';
import Sqlite from 'driver/sqlite';

import { token as appClientToken, AppClient } from 'infra/AppClient';
import { token as fileReaderToken } from 'infra/FileReader';
import { token as databaseToken, Database } from 'infra/Database';

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
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();
    await this.sqliteDb.init(configDir);
  }
}
