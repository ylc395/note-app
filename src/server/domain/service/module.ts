import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import FileService from './FileService';
import TopicService from './TopicService';
import MemoService from './MemoService';
import MaterialService from './MaterialService';
import RevisionService from './RevisionService';
import SyncService from './SyncService';
import EntityService from './EntityService';

const services = [
  NoteService,
  RecyclableService,
  StarService,
  FileService,
  TopicService,
  MemoService,
  MaterialService,
  RevisionService,
  SyncService,
  EntityService,
];

@Module({
  imports: [forwardRef(() => EventEmitterModule.forRoot({ verboseMemoryLeak: true }))], // use forwardRef to prevent one emitter shared by different env
  providers: [BaseService, ...services],
  exports: services,
})
export default class ServiceModule {}
