import { Inject, Module, type OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import ServiceModule from 'service/module';
import RepositoryModule from 'driver/sqlite/repository/module';
import DriverModule from './driver.module';
import { token as appClientToken, type AppClient } from 'infra/AppClient';
import sqliteDb from 'driver/sqlite';

import NoteController from 'controller/NotesController';

@Module({
  imports: [EventEmitterModule.forRoot(), ServiceModule, RepositoryModule, DriverModule],
  controllers: [NoteController],
})
export default class AppModule implements OnApplicationBootstrap {
  constructor(@Inject(appClientToken) private readonly electronApp: AppClient) {}
  async onApplicationBootstrap() {
    const configDir = this.electronApp.getConfigDir();

    await sqliteDb.init(configDir);
  }
}
