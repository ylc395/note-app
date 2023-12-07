import type { Config } from '@shared/domain/model/config.js';

export * from '@shared/domain/model/config.js';

export const DEFAULT_CONFIG: Required<Config> = {
  'httpServer.enabled': false,
  unknown: 'unknown',
};
