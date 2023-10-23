import type { Config } from 'model/config';

export interface ConfigRepository {
  getAll(): Promise<Required<Config>>;
  update(config: Config): Promise<void>;
}
