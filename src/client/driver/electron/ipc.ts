export const IPC_CHANNEL = 'fakeHttp';

export interface IpcRequest<T> {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  query?: T;
  params?: Record<string, string>;
  body?: T;
  headers?: Record<string, string>;
}

export interface IpcResponse<T = unknown> {
  status: number;
  body: T & { error?: unknown };
  headers?: Record<string, string>;
}
