import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import * as controllers from 'controller';
import { token as appClientToken } from 'infra/appClient';
import BaseAppClient from 'client/driver/electron/BaseClient';
import ElectronInfraModule from 'driver/electron/infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';
import HttpGuard from './HttpGuard';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [
    { provide: appClientToken, useClass: BaseAppClient },
    { provide: APP_GUARD, useClass: HttpGuard },
  ],
  exports: [ElectronInfraModule, appClientToken],
})
export default class LocalHttpModule {}
