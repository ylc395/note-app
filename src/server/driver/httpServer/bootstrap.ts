/** used in development env */
import '../enableEsm';
/*******/

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import AppModule from 'module/app.module';
import HttpGuard from './HttpGuard';

export default async function bootstrap() {
  const httpApp = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  httpApp.useGlobalGuards(new HttpGuard());
  httpApp.useBodyParser('json', { limit: Infinity });
  await httpApp.listen(3001);
}
