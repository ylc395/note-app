import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import ServiceModule from 'service/module';
import * as controllers from 'controller';
import DriverModule from './driver.module';

@Module({
  imports: [EventEmitterModule.forRoot(), ServiceModule, DriverModule],
  controllers: Object.values(controllers),
})
export default class AppModule {}
