import { Module } from '@nestjs/common';

import FileService from './FileService';
import MaterialService from './MaterialService';

const services = [FileService, MaterialService];

@Module({
  providers: services,
  exports: services,
})
export default class ServiceModule {}
