import { Global, Module, type OnModuleInit } from '@nestjs/common';

import * as controllers from 'controller';

import { token as clientAppToken, EventNames as ClientAppEventNames } from 'infra/ClientApp';
import ElectronApp from 'client/driver/desktop/electron';
import ProtocolRegister from './infra/ProtocolRegister';
import ElectronInfraModule from './infra/module';
import SqliteModule from 'driver/sqlite/module';
import ServiceModule from 'service/module';

@Global()
@Module({
  controllers: Object.values(controllers),
  imports: [ElectronInfraModule, SqliteModule, ServiceModule],
  providers: [ProtocolRegister, ElectronApp, { provide: clientAppToken, useExisting: ElectronApp }],
  exports: [ElectronInfraModule, clientAppToken],
})
export default class ElectronModule implements OnModuleInit {
  constructor(private readonly clientApp: ElectronApp, private readonly protocolRegister: ProtocolRegister) {}

  async onModuleInit() {
    this.clientApp.once(ClientAppEventNames.Ready, () => this.protocolRegister.register());
    await this.clientApp.start();
  }
}
