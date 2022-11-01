// https://github.com/axios/axios#response-schema
export interface Response<T = undefined> {
  status: number;
  body: T;
  headers?: Record<string, string>;
}

export interface Remote {
  get: <T, K = undefined>(path: string, query?: T) => Promise<Response<K & { error?: string }>>;
  post: <T, K = undefined>(path: string, body: T) => Promise<Response<K & { error?: string }>>;
}

export const token = Symbol('remoteToken');
