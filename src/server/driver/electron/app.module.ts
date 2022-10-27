import { Global, Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';

import MaterialsController from 'controller/MaterialsController';
import FilesController from 'controller/FilesController';

import RepositoryModule from 'driver/sqlite/repository/module';
import ServiceModule from 'service/module';
import { token as fileReaderToken } from 'infra/FileReader';
import { token as localClientToken, type LocalClient } from 'infra/LocalClient';

import FileReader from 'driver/fs';
import sqliteDb from 'driver/sqlite/db';
import ElectronApp from 'client/driver/electron';

@Global()
@Module({
  providers: [
    { provide: fileReaderToken, useClass: FileReader },
    { provide: localClientToken, useClass: ElectronApp },
  ],
  exports: [fileReaderToken, localClientToken],
})
class DriverModule {}

@Module({
  imports: [ServiceModule, RepositoryModule, DriverModule],
  controllers: [MaterialsController, FilesController],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(@Inject(localClientToken) private readonly electronApp: LocalClient) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await sqliteDb.init(configDir);
  }
}
