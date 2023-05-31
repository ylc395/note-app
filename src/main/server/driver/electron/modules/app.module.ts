import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import ServiceModule from 'service/module';
import * as controllers from 'controller';
import InfraModule from './infra.module';

@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true }), ServiceModule, InfraModule],
  controllers: Object.values(controllers),
})
export default class AppModule {}
