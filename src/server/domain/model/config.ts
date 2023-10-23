export * from 'shard/model/config';
import type { Config } from 'shard/model/config';

export const DEFAULT_CONFIG: Required<Config> = {
  'ocr.language': 'chi_sim',
  'httpServer.enabled': false,
};
