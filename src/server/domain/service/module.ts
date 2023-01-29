import { Module } from '@nestjs/common';

import NoteService from './NoteService';

const services = [NoteService];

@Module({
  providers: services,
  exports: services,
})
export default class ServiceModule {}
