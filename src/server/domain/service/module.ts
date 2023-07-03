import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import ResourceService from './ResourceService';
import TopicService from './TopicService';
import MemoService from './MemoService';
import MaterialService from './MaterialService';
import RevisionService from './RevisionService';
import SyncService from './SyncService';

const services = [
  NoteService,
  RecyclableService,
  StarService,
  ResourceService,
  TopicService,
  MemoService,
  MaterialService,
  RevisionService,
  SyncService,
];

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [BaseService, ...services],
  exports: services,
})
export default class ServiceModule {}
