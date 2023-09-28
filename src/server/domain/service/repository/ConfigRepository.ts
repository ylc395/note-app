import type { Config } from 'model/config';

export interface ConfigRepository {
  getAll(): Promise<Config>;
  update(config: Config): Promise<void>;
}
