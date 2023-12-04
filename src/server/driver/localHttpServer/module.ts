import { Global, Module, type OnApplicationShutdown, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import * as controllers from 'controller';
import { token as runtimeToken } from '@domain/infra/DesktopRuntime';
import LocalHttpRuntime from 'driver/localHttpServer/Runtime';
import ElectronInfraModule from 'driver/electron/infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from '@domain/service/module';

import HttpGuard from './HttpGuard';

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
