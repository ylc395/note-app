import { Controller, Inject } from '@nestjs/common';

import { type AppServerDTO, type AppServerStatus, appServerDTOSchema } from 'model/app';
import { token as runtimeToken } from 'infra/Runtime';
import type Runtime from 'infra/Runtime';
import { Body, EnableOnly, Get, Post, createSchemaPipe } from './decorators';

@Controller()
export default class AppStatusController {
  constructor(@Inject(runtimeToken) private readonly runtime: Runtime) {}

  @Get('/app/ping')
  async ping(): Promise<void> {
    return;
  }

  @EnableOnly('ipc')
  @Post('/app/httpServer')
  async bootstrapHttpServer(
    @Body(createSchemaPipe(appServerDTOSchema)) { isOnline }: AppServerDTO,
  ): Promise<AppServerStatus | null> {
    if (!this.runtime.toggleHttpServer) {
      throw new Error('can not toggle httpServer');
    }

    return await this.runtime.toggleHttpServer(isOnline);
  }

  @EnableOnly('ipc')
  @Get('/app/token')
  async getToken(): Promise<string> {
    return await this.runtime.getAppToken();
  }
}
