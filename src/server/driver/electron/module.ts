import { Global, Module, type OnModuleInit } from '@nestjs/common';

import * as controllers from 'controller';
import { token as runtimeToken } from 'infra/Runtime';
import ElectronRuntime from 'driver/electron';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';

import ElectronInfraModule from './infra/module';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [ElectronRuntime, { provide: runtimeToken, useExisting: ElectronRuntime }],
  exports: [ElectronInfraModule, runtimeToken],
})
export default class ElectronModule implements OnModuleInit {
  constructor(private readonly app: ElectronRuntime) {}

  async onModuleInit() {
    await this.app.start();
  }
}
