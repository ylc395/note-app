import { Controller, Inject } from '@nestjs/common';

import { type AppServerDTO, type AppServerStatus, appServerDTOSchema } from 'model/app';
import { token as clientAppToken } from 'infra/ClientApp';
import type ClientApp from 'infra/ClientApp';
import { Body, Get, Post, createSchemaPipe } from './decorators';

@Controller()
export default class AppStatusController {
  constructor(@Inject(clientAppToken) private readonly clientApp: ClientApp) {}

  @Get('/app/ping')
  async ping(): Promise<void> {
    return;
  }

  @Post('/app/httpServer')
  async bootstrapHttpServer(
    @Body(createSchemaPipe(appServerDTOSchema)) { isOnline }: AppServerDTO,
  ): Promise<AppServerStatus | null> {
    if (!this.clientApp.toggleHttpServer) {
      throw new Error('can not toggle httpServer');
    }

    return await this.clientApp.toggleHttpServer(isOnline);
  }

  @Get('/app/token')
  async getToken(): Promise<string> {
    return await this.clientApp.getAppToken();
  }
}
