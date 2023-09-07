import { Controller, Inject } from '@nestjs/common';

import { type AppServerDTO, type AppServerStatus, appServerDTOSchema } from 'model/app';
import { token as runtimeToken } from 'infra/Runtime';
import type Runtime from 'infra/Runtime';
import { Body, Get, Post, createSchemaPipe } from './decorators';

@Controller()
export default class AppStatusController {
  constructor(@Inject(runtimeToken) private readonly runtime: Runtime) {}

  @Get('/app/ping')
  async ping(): Promise<void> {
    return;
  }

  @Post('/app/httpServer')
  async bootstrapHttpServer(
    @Body(createSchemaPipe(appServerDTOSchema)) { isOnline }: AppServerDTO,
  ): Promise<AppServerStatus | null> {
    if (!this.runtime.toggleHttpServer) {
      throw new Error('can not toggle httpServer');
    }

    return await this.runtime.toggleHttpServer(isOnline);
  }

  @Get('/app/token')
  async getToken(): Promise<string> {
    if (!this.runtime.isMain()) {
      throw new Error('can not get token');
    }

    return await this.runtime.getAppToken();
  }
}
