import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import ElectronModule from './module.js';
import ElectronTransporter, { RawExceptionFilter } from './infra/IpcServer/index.js';

export default async function bootstrap() {
  const electronApp = await NestFactory.createMicroservice<MicroserviceOptions>(ElectronModule, {
    strategy: new ElectronTransporter(),
  });
  electronApp.useGlobalFilters(new RawExceptionFilter());
  await electronApp.listen();
}
