export const FAKE_HTTP_CHANNEL = 'fakeHttp';

export interface FakeHttpRequest<T> {
  path: string;
  originPath?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  query?: T;
  params?: Record<string, string>;
  body?: T;
  headers?: Record<string, string>;
}

export interface FakeHttpResponse<T = unknown> {
  status: number;
  body: T & { error?: unknown };
  headers?: Record<string, string>;
}
