import type { Config } from '@domain/model/config.js';

import BaseService from './BaseService.js';

export default class AppService extends BaseService {
  queryConfig() {
    // return this.repo.configs.getAll();
  }

  async updateConfig(config: Config) {
    // await this.repo.configs.update(config);

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
