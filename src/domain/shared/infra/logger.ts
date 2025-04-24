import type { Token } from '#utils/singletonContainer';

export interface Logger {
  debug: (...content: unknown[]) => void;
  error: (...content: unknown[]) => void;
  log: (...content: unknown[]) => void;
  warn: (...content: unknown[]) => void;
}

export const token: Token<Logger> = Symbol('logger');
