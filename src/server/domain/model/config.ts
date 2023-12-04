import type { Config } from '@shared/domain/model/config';

export * from '@shared/domain/model/config';

export const DEFAULT_CONFIG: Required<Config> = {
  'httpServer.enabled': false,
  unknown: 'unknown',
};
