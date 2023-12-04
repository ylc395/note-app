import type { Config } from '@domain/model/config';

export interface ConfigRepository {
  getAll(): Promise<Required<Config>>;
  update(config: Config): Promise<void>;
}
