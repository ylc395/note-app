import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import ServiceModule from 'service/module';

import NotesController from 'controller/NotesController';
import RecyclablesController from 'controller/RecyclablesController';
import IconsController from 'controller/IconsController';
import StarsController from 'controller/StarsController';

import DriverModule from './driver.module';

@Module({
  imports: [EventEmitterModule.forRoot(), ServiceModule, DriverModule],
  controllers: [NotesController, RecyclablesController, IconsController, StarsController],
})
export default class AppModule {}
