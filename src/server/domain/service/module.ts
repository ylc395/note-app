import { Module } from '@nestjs/common';

import FileService from './FileService';
import MaterialService from './MaterialService';
import TagService from './TagService';

const services = [FileService, MaterialService, TagService];

@Module({
  providers: services,
  exports: services,
})
export default class ServiceModule {}
