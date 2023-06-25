import { Global, Module, type OnModuleInit } from '@nestjs/common';

import * as controllers from 'controller';

import { token as appClientToken, EventNames as AppClientEventNames } from 'infra/appClient';
import ElectronAppClient from 'client/driver/electron';
import ProtocolRegister from './infra/ProtocolRegister';
import ElectronInfraModule from './infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [ProtocolRegister, ElectronAppClient, { provide: appClientToken, useExisting: ElectronAppClient }],
  exports: [ElectronInfraModule, appClientToken],
})
export default class ElectronModule implements OnModuleInit {
  constructor(private readonly appClient: ElectronAppClient, private readonly protocolRegister: ProtocolRegister) {}

  async onModuleInit() {
    this.appClient.once(AppClientEventNames.Ready, () => this.protocolRegister.register());
    await this.appClient.start();
  }
}
