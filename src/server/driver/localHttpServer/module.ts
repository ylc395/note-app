import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import * as controllers from 'controller';
import { token as clientAppToken } from 'infra/ClientApp';
import HeadlessApp from 'client/driver/HeadlessApp';
import ElectronInfraModule from 'driver/electron/infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';

import HttpGuard from './HttpGuard';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [
    { provide: clientAppToken, useClass: HeadlessApp },
    { provide: APP_GUARD, useClass: HttpGuard },
  ],
  exports: [ElectronInfraModule, clientAppToken],
})
export default class LocalHttpModule {}
