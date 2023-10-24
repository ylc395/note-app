export * from 'shard/model/config';
import type { Config } from 'shard/model/config';

export const DEFAULT_CONFIG: Required<Config> = {
  'httpServer.enabled': false,
  unknown: 'unknown',
};
