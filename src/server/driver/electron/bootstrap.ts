/** used in development env */
import '../enableEsm';
/*******/
import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import { type AppClient, token as appClientToken } from 'infra/appClient';
import ElectronModule from './module';

import ElectronTransporter, { RawExceptionFilter } from './infra/IpcServer';

export default async function bootstrap() {
  const electronApp = await NestFactory.createMicroservice<MicroserviceOptions>(ElectronModule, {
    strategy: new ElectronTransporter(),
  });
  electronApp.useGlobalFilters(new RawExceptionFilter());
  await electronApp.listen();
}
