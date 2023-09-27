import { Global, Module } from '@nestjs/common';

import NoteService from './NoteService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import FileService from './FileService';
import ContentService from './ContentService';
import MemoService from './MemoService';
import MaterialService from './MaterialService';
import RevisionService from './RevisionService';
import SyncService from './SyncService';
import EntityService from './EntityService';
import SearchService from './SearchService';
import { token as eventBusToken, eventBus } from 'infra/eventBus';

const services = [
  NoteService,
  RecyclableService,
  StarService,
  FileService,
  ContentService,
  MemoService,
  MaterialService,
  RevisionService,
  SyncService,
  EntityService,
  SearchService,
];

@Global()
@Module({
  providers: [...services, { provide: eventBusToken, useValue: eventBus }],
  exports: [...services, eventBusToken],
})
export default class ServiceModule {}
