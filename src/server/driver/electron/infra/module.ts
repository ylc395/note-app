import { Module } from '@nestjs/common';

import { token as downloaderToken } from '@domain/infra/fileReader';
import { token as syncTargetFactoryToken } from '@domain/infra/synchronizer';

import ElectronFileReader from './FileReader';
import syncTargetFactory from './syncTargetFactory';

@Module({
  providers: [
    { provide: downloaderToken, useClass: ElectronFileReader },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
  ],
  exports: [downloaderToken, syncTargetFactoryToken],
})
export default class ElectronInfraModule {}
