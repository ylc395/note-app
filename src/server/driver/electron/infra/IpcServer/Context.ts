import type { IResponse, IpcResponse } from 'infra/transport';

export default class Context implements IResponse {
  readonly headers: NonNullable<IpcResponse['headers']> = {};

  set(key: string, value: string) {
    this.headers[key] = value;
  }

  getHeaders() {
    return this.headers;
  }
}
