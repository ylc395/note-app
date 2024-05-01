import type { Config } from '@domain/shared/model/config.js';

export interface ConfigRepository {
  getAll(): Promise<Required<Config>>;
  update(config: Config): Promise<void>;
}
