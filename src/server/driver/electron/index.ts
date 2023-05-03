/** used in development env */
import './enableEsm';
/*******/

import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { type AppClient, token as appClientToken } from 'infra/AppClient';

import AppModule from './modules/app.module';
import ElectronTransporter, { RawExceptionFilter } from './infra/IpcServer';

async function bootstrap() {
  const electronApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransporter(),
  });
  electronApp.useGlobalFilters(new RawExceptionFilter());
  await electronApp.listen();
  const electronClient = electronApp.get<AppClient>(appClientToken);
  await electronClient.start();

  const httpApp = await NestFactory.create<NestExpressApplication>(AppModule);
  await httpApp.listen(3001);
}

bootstrap();
