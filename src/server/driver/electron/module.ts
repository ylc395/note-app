import { Global, Module, type OnModuleInit } from '@nestjs/common';

import * as controllers from 'controller';

import { token as clientAppToken } from 'infra/ClientApp';
import ElectronApp from 'client/driver/electron';
import ElectronInfraModule from './infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [ElectronApp, { provide: clientAppToken, useExisting: ElectronApp }],
  exports: [ElectronInfraModule, clientAppToken],
})
export default class ElectronModule implements OnModuleInit {
  constructor(private readonly clientApp: ElectronApp) {}

  async onModuleInit() {
    await this.clientApp.start();
  }
}
