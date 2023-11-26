import type { InjectionToken } from 'tsyringe';

// https://github.com/axios/axios#response-schema
export interface Response<T = undefined> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

export interface Remote {
  get: <T, K = undefined, H = undefined>(path: string, query?: T, headers?: H) => Promise<Response<K>>;
  post: <T, K = undefined, H = undefined>(path: string, body?: T, headers?: H) => Promise<Response<K>>;
  delete: <T, K = undefined, H = undefined>(path: string, query?: T, headers?: H) => Promise<Response<K>>;
  patch: <T, K = undefined, H = undefined>(path: string, body: T, headers?: H) => Promise<Response<K>>;
  put: <T, K = undefined, H = undefined>(path: string, body: T, headers?: H) => Promise<Response<K>>;
}

export const token: InjectionToken<Remote> = Symbol('remoteToken');
