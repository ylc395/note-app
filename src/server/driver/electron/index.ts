import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import AppModule from './modules/app.module';
import ElectronTransporter, { RawExceptionFilter } from './IpcServer';

import { type AppClient, token as appClientToken } from 'infra/AppClient';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransporter(),
  });
  app.useGlobalFilters(new RawExceptionFilter());
  await app.listen();

  const electronApp = app.get<AppClient>(appClientToken);
  await electronApp.start();
}

bootstrap();
