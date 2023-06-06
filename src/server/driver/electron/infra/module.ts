import { Module } from '@nestjs/common';

import { token as downloaderToken } from 'infra/downloader';
import { token as syncTargetFactoryToken } from 'infra/synchronizer';

import Downloader from './Downloader';
import syncTargetFactory from './syncTargetFactory';

@Module({
  providers: [
    { provide: downloaderToken, useClass: Downloader },
    { provide: syncTargetFactoryToken, useValue: syncTargetFactory },
  ],
  exports: [downloaderToken, syncTargetFactoryToken],
})
export default class ElectronInfraModule {}
