export const IPC_CHANNEL = 'fakeHttp';

// https://expressjs.com/en/api.html#req
export interface IpcRequest {
  path: string;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  body?: unknown;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
}
