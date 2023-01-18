import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import ServiceModule from 'service/module';
import RepositoryModule from 'driver/sqlite/repository/module';
import DriverModule from './driver.module';
import { token as appClientToken, type AppClient } from 'infra/AppClient';
import sqliteDb from 'driver/sqlite';

import MaterialsController from 'controller/MaterialsController';
import FilesController from 'controller/FilesController';
import TagsController from 'controller/TagsController';

@Module({
  imports: [EventEmitterModule.forRoot(), ServiceModule, RepositoryModule, DriverModule],
  controllers: [MaterialsController, FilesController, TagsController],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(@Inject(appClientToken) private readonly electronApp: AppClient) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await sqliteDb.init(configDir);
  }
}
