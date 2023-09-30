import { Injectable, OnModuleInit } from '@nestjs/common';

import type { Config } from 'model/config';

import BaseService from './BaseService';

@Injectable()
export default class AppService extends BaseService implements OnModuleInit {
  async onModuleInit() {
    const config = await this.queryConfig();

    if (config['httpServer.enabled'] && this.runtime.toggleHttpServer) {
      this.runtime.toggleHttpServer(config['httpServer.enabled']);
    }
  }

  queryConfig() {
    return this.repo.configs.getAll();
  }

  async updateConfig(config: Config) {
    await this.repo.configs.update(config);

    for (const [key, value] of Object.entries(config)) {
      this.eventBus.appConfig.emit(key as keyof Config, value);
    }
  }

  async toggleHttpServer(enabled: boolean) {
    if (!this.runtime.toggleHttpServer) {
      throw new Error('can not toggle httpServer');
    }

    const result = await this.runtime.toggleHttpServer(enabled);
    this.updateConfig({ 'httpServer.enabled': enabled });

    return result;
  }
}
