import { Module } from '@nestjs/common';

import BaseService from './BaseService';
import NoteService from './NoteService';
import RecyclableService from './RecyclableService';
import StarService from './StarService';
import ResourceService from './ResourceService';
import TopicService from './TopicService';
import MemoService from './MemoService';
import MaterialService from './MaterialService';
import LintService from './LintService';

const services = [
  NoteService,
  RecyclableService,
  StarService,
  ResourceService,
  TopicService,
  MemoService,
  MaterialService,
  LintService,
];

@Module({
  providers: [BaseService, ...services],
  exports: services,
})
export default class ServiceModule {}
