import type { Response } from 'infra/Remote';
export const IPC_CHANNEL = 'fakeHttp';

// https://expressjs.com/en/api.html#req
export interface IpcRequest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

export type IpcResponse = Response;
