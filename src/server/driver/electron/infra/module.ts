import { Module } from '@nestjs/common';

import { token as downloaderToken } from '@domain/infra/fileReader.js';
import { token as syncTargetFactoryToken } from '@domain/infra/synchronizer.js';

import ElectronFileReader from './FileReader.js';
import syncTargetFactory from './syncTargetFactory/index.js';

@Module({
  providers: [
    { provide: downloaderToken, useClass: ElectronFileReader },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
  ],
  exports: [downloaderToken, syncTargetFactoryToken],
})
export default class ElectronInfraModule {}
