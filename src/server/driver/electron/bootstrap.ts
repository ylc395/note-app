/** used in development env */
import '../enableEsm';
/*******/
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import { type AppClient, token as appClientToken } from 'infra/appClient';
import AppModule from 'module/app.module';

import ElectronTransporter, { RawExceptionFilter } from './infra/IpcServer';

export default async function bootstrap() {
  const electronApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransporter(),
  });
  electronApp.useGlobalFilters(new RawExceptionFilter());
  await electronApp.listen();
  const electronClient = electronApp.get<AppClient>(appClientToken);
  await electronClient.start();
}
