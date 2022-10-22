import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';

import MaterialsController from 'controller/MaterialsController';
import RepositoryModule from './repository.module';
import { token as fileReaderToken } from 'infra/FileReader';
import { token as localClientToken, type LocalClient } from 'infra/LocalClient';

import MaterialService from 'service/MaterialService';

import FileReader from 'driver/fs';
import sqliteDb from 'driver/sqlite/db';
import ElectronApp from 'client/driver/electron';

@Module({
  controllers: [MaterialsController],
  imports: [RepositoryModule],
  providers: [
    { provide: fileReaderToken, useClass: FileReader },
    { provide: localClientToken, useClass: ElectronApp },
    MaterialService,
  ],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(@Inject(localClientToken) private readonly electronApp: LocalClient) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await sqliteDb.init(configDir);
  }
}
