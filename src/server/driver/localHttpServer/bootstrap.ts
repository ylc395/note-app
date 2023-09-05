import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import AppModule from './module';

export default async function bootstrap() {
  const httpApp = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  httpApp.useBodyParser('json', { limit: Infinity });
  await httpApp.listen(3001);

  return {
    port: 3001,
    terminate: httpApp.close.bind(httpApp),
  };
}
