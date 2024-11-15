import { Type } from 'di-wise';

export interface Logger {
  debug: (...content: unknown[]) => void;
  error: (...content: unknown[]) => void;
  log: (...content: unknown[]) => void;
  warn: (...content: unknown[]) => void;
}

export const token = Type<Logger>('logger');
