import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import AppModule from './module.js';

export default class LocalServer {
  private nestApp?: NestExpressApplication;
  async start() {
    const httpApp = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

    httpApp.useBodyParser('json', { limit: Infinity });
    this.nestApp = httpApp;
    await httpApp.listen(3001);

    return 3001;
  }

  async close() {
    if (!this.nestApp) {
      throw new Error('not start');
    }

    this.nestApp.close();
  }
}
