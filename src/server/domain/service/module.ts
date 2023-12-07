import { Global, Module } from '@nestjs/common';

import NoteService from './NoteService.js';
import RecyclableService from './RecyclableService.js';
import StarService from './StarService.js';
import FileService from './FileService/index.js';
import ContentService from './ContentService.js';
import MemoService from './MemoService.js';
import MaterialService from './MaterialService.js';
import RevisionService from './RevisionService.js';
import SyncService from './SyncService.js';
import EntityService from './EntityService.js';
import SearchService from './SearchService.js';
import AppService from './AppService.js';
import { token as eventBusToken, eventBus } from '@domain/infra/eventBus.js';

const services = [
  AppService,
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
