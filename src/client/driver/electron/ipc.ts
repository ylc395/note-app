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

// https://github.com/axios/axios#response-schema
export interface IpcResponse<T = unknown> {
  status: number;
  body?: T;
  headers?: Record<string, string>;
}
