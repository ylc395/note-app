import { Global, Module } from '@nestjs/common';

import ElectronApp from 'client/driver/electron';
import { token as localClientToken } from 'infra/LocalClient';
import FileReader from 'driver/fs';
import { token as fileReaderToken } from 'infra/FileReader';

const drivers = [
  [fileReaderToken, FileReader],
  [localClientToken, ElectronApp],
] as const;

@Global()
@Module({
  providers: drivers.map(([token, driverClass]) => ({ provide: token, useClass: driverClass })),
  exports: drivers.map(([token]) => token),
})
export default class DriverModule {}
