import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';

import MaterialsController from 'controller/MaterialsController';
import { type Database, token as databaseToken } from 'service/infra/Database';
import { token as fileReaderToken } from 'service/infra/FileReader';
import SqliteDb from 'driver/sqlite';
import FileReader from 'driver/fs';
import ElectronApp from 'client/driver/electron';

@Module({
  controllers: [MaterialsController],
  providers: [
    { provide: databaseToken, useClass: SqliteDb },
    { provide: fileReaderToken, useClass: FileReader },
    ElectronApp,
  ],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(
    @Inject(databaseToken) private readonly db: Database,
    @Inject(ElectronApp) private readonly electronApp: ElectronApp,
  ) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await this.db.init(configDir);
    await this.electronApp.start();
  }
}
