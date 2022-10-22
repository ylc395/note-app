import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import AppModule from './app.module';
import ElectronTransporter from './IpcServer';

import { LocalClient, token as localClientToken } from 'infra/LocalClient';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransporter(),
  });
  await app.listen();

  const electronApp = app.get<LocalClient>(localClientToken);
  await electronApp.start();
}

bootstrap();
