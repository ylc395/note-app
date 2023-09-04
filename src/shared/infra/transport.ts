export interface IResponse {
  set: (k: string, v: string) => void;
}

export interface IRequest<T = unknown> {
  body?: T;
}

export const IPC_CHANNEL = 'ipc_transport';

export interface IpcRequest<T> extends IRequest<T> {
  path: string;
  route?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  query?: T;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export interface IpcResponse<T = unknown> {
  status: number;
  body: T & { error?: unknown };
  headers?: Record<string, string>;
}
