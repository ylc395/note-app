import { Global, Module, type OnApplicationShutdown, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import * as controllers from 'controller/index.js';
import { token as runtimeToken } from '@domain/infra/DesktopRuntime.js';
import LocalHttpRuntime from 'driver/localHttpServer/Runtime.js';
import ElectronInfraModule from 'driver/electron/infra/module.js';
import SqliteModule from 'driver/sqlite/module.js';
import ServiceModule from '@domain/service/module.js';

import HttpGuard from './HttpGuard.js';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [
    { provide: runtimeToken, useClass: LocalHttpRuntime },
    { provide: APP_GUARD, useClass: HttpGuard },
  ],
  exports: [ElectronInfraModule, runtimeToken],
})
export default class LocalHttpModule implements OnApplicationShutdown {
  private readonly logger = new Logger('localHttp module');

  onApplicationShutdown() {
    this.logger.log('shutdown');
  }
}
