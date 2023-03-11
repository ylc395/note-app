import { Module } from '@nestjs/common';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import FileService from './FileService';

const services = [NoteService, RecyclableService, StarService, FileService];

@Module({
  providers: [BaseService, ...services],
  exports: services,
})
export default class ServiceModule {}
