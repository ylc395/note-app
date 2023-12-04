import { Controller, Inject } from '@nestjs/common';

import { type AppServerDTO, type AppServerStatus, appServerDTOSchema } from '@domain/model/app';
import { type ConfigDTO, type Config, configSchema } from '@domain/model/config';
import { token as runtimeToken } from '@domain/infra/DesktopRuntime';
import type DesktopRuntime from '@domain/infra/DesktopRuntime';
import AppService from '@domain/service/AppService';

import { Body, EnableOnly, Get, Patch, Post, createSchemaPipe } from './decorators';

@Controller()
export default class AppController {
  constructor(
    @Inject(runtimeToken) private readonly runtime: DesktopRuntime,
    private readonly appService: AppService,
  ) {}

  @Get('/app/ping')
  async ping(): Promise<void> {
    return;
  }

  @Get('/app/config')
  async queryConfig(): Promise<Required<Config>> {
    return this.appService.queryConfig();
  }

  @Patch('/app/config')
  async updateConfig(@Body(createSchemaPipe(configSchema)) config: ConfigDTO): Promise<void> {
    return this.appService.updateConfig(config);
  }

  @EnableOnly('ipc')
  @Post('/app/httpServer')
  async bootstrapHttpServer(
    @Body(createSchemaPipe(appServerDTOSchema)) { isOnline }: AppServerDTO,
  ): Promise<AppServerStatus | null> {
    return this.appService.toggleHttpServer(isOnline);
  }

  @EnableOnly('ipc')
  @Get('/app/token')
  async getToken(): Promise<string> {
    return await this.runtime.getAppToken();
  }
}
