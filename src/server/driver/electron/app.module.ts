import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import MaterialsController from 'controller/MaterialsController';
import FilesController from 'controller/FilesController';

import ServiceModule from 'service/module';
import RepositoryModule from 'driver/sqlite/repository/module';
import DriverModule from './driver.module';

import { token as localClientToken, type LocalClient } from 'infra/LocalClient';

import sqliteDb from 'driver/sqlite/db';

@Module({
  imports: [EventEmitterModule.forRoot(), ServiceModule, RepositoryModule, DriverModule],
  controllers: [MaterialsController, FilesController],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(@Inject(localClientToken) private readonly electronApp: LocalClient) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await sqliteDb.init(configDir);
  }
}
