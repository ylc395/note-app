import type { Response } from 'infra/Remote';
export const IPC_CHANNEL = 'fakeHttp';

// https://expressjs.com/en/api.html#req
export interface IpcRequest<T> {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  query?: T;
  params?: Record<string, string>;
  body?: T;
  headers?: Record<string, string>;
}

export type IpcResponse<T> = Response<T>;
