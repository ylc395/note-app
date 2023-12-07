import type { IResponse, IpcResponse } from '@domain/infra/transport.js';

export default class Context implements IResponse {
  readonly headers: NonNullable<IpcResponse['headers']> = {};

  set(key: string, value: string) {
    this.headers[key] = value;
  }

  getHeaders() {
    return this.headers;
  }
}
