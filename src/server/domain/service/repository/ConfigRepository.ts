import type { Config } from '@domain/model/config.js';

export interface ConfigRepository {
  getAll(): Promise<Required<Config>>;
  update(config: Config): Promise<void>;
}
