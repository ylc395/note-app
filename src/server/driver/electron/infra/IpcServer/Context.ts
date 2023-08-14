import type { FakeHttpResponse } from 'infra/fakeHttp';

export default class Context {
  readonly headers: NonNullable<FakeHttpResponse['headers']> = {};

  set(key: string, value: string) {
    this.headers[key] = value;
  }

  getHeaders() {
    return this.headers;
  }
}
