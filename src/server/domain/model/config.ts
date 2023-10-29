export * from 'shared/model/config';
import type { Config } from 'shared/model/config';

export const DEFAULT_CONFIG: Required<Config> = {
  'httpServer.enabled': false,
  unknown: 'unknown',
};
