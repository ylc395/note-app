import { Module } from '@nestjs/common';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';

const services = [NoteService, RecyclableService];

@Module({
  providers: [BaseService, ...services],
  exports: services,
})
export default class ServiceModule {}
