import type { Config } from '@domain/shared/model/config.js';

export * from '@domain/shared/model/config.js';

export const DEFAULT_CONFIG: Required<Config> = {
  'httpServer.enabled': false,
  unknown: 'unknown',
};
