import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';

import * as controllers from 'controller/index.js';
import { token as runtimeToken } from '@domain/infra/DesktopRuntime.js';
import ElectronRuntime from 'driver/electron/index.js';
import SqliteModule from 'driver/sqlite/module.js';
import ServiceModule from '@domain/service/module.js';

import ElectronInfraModule from './infra/module.js';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [{ provide: runtimeToken, useClass: ElectronRuntime }],
  exports: [ElectronInfraModule, runtimeToken],
})
export default class ElectronModule implements OnModuleInit {
  constructor(@Inject(runtimeToken) private readonly app: ElectronRuntime) {}

  async onModuleInit() {
    await this.app.start();
  }
}
