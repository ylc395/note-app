import { Module } from '@nestjs/common';

import NoteService from './NoteService';
import RecyclableService from './RecyclableService';

const services = [NoteService, RecyclableService];

@Module({
  providers: services,
  exports: services,
})
export default class ServiceModule {}
