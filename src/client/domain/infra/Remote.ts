import type { InjectionToken } from 'tsyringe';

// https://github.com/axios/axios#response-schema
export interface Response<T = unknown> {
  status: number;
  body?: T;
  headers?: Record<string, string>;
}

export interface Remote {
  get: <T = void>(path: string, query: Record<string, unknown>) => Promise<Response<T>>;
  post: <T = void>(path: string, body: unknown) => Promise<Response<T>>;
}

export const token: InjectionToken<Remote> = Symbol('remoteToken');
