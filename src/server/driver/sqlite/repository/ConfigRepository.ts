import type { ConfigRepository } from '@domain/service/repository/ConfigRepository';
import { type Config, DEFAULT_CONFIG } from '@domain/model/config';

import BaseRepository from './BaseRepository';

const CONFIG_KEY = 'app.config';

export default class SqliteConfigRepository extends BaseRepository implements ConfigRepository {
  async getAll() {
    const configStr = (await this.kv.get(CONFIG_KEY)) || '{}';
    return { ...DEFAULT_CONFIG, ...JSON.parse(configStr) };
  }

  async update(config: Config) {
    const currentConfig = JSON.parse((await this.kv.get(CONFIG_KEY)) || '{}');
    await this.kv.set(CONFIG_KEY, JSON.stringify({ ...currentConfig, ...config }));
  }
}
