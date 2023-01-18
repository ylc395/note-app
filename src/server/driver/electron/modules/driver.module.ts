import { Global, Module } from '@nestjs/common';

import ElectronClient from 'client/driver/electron';
import { token as appClientToken } from 'infra/AppClient';
import FileReader from 'driver/fs';
import { token as fileReaderToken } from 'infra/FileReader';

const drivers = [
  [fileReaderToken, FileReader],
  [appClientToken, ElectronClient],
] as const;

@Global()
@Module({
  providers: drivers.map(([token, driverClass]) => ({ provide: token, useClass: driverClass })),
  exports: drivers.map(([token]) => token),
})
export default class DriverModule {}
