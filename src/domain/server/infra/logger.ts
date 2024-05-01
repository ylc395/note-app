import type { InjectionToken } from 'tsyringe';

export const token: InjectionToken<Logger> = Symbol('logger');

export interface Logger {
  debug: (content: unknown) => void;
  error: (content: unknown) => void;
  log: (content: unknown) => void;
  warn: (content: unknown) => void;
}
