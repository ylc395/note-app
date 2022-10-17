import type { InjectionToken } from 'tsyringe';

export const a = 1;

export interface Remote {
  get: <T = void>(path: string, query: Record<string, unknown>) => Promise<T>;
  post: <T = void>(path: string, body: unknown) => Promise<T>;
}

export const token: InjectionToken<Remote> = Symbol('remoteToken');
