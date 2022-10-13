import { NestFactory } from '@nestjs/core';
import type { MicroserviceOptions } from '@nestjs/microservices';

import AppModule from './app.module';
import ElectronTransporter from './driver/electron/IpcServer';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    strategy: new ElectronTransporter(),
  });

  await app.listen();
}

bootstrap();
