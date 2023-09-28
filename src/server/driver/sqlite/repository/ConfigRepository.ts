import type { ConfigRepository } from 'service/repository/ConfigRepository';
import type { Config } from 'model/config';

import BaseRepository from './BaseRepository';

const CONFIG_KEY = 'app.config';

export default class SqliteConfigRepository extends BaseRepository implements ConfigRepository {
  async getAll() {
    const configStr = (await this.kv.get(CONFIG_KEY)) || '{}';
    return JSON.parse(configStr);
  }

  async update(config: Config) {
    const currentConfig = await this.getAll();
    await this.kv.set(CONFIG_KEY, JSON.stringify({ ...currentConfig, ...config }));
  }
}
