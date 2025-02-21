import type { ZodType } from 'zod';
import { action, observable } from 'mobx';
import assert from 'assert';

import { container } from '#domain/shared/infra/singletons';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';

export default class PersistedObject<S> {
  constructor(private readonly id: string, private readonly schema: ZodType<S>) {
    const { promise, resolve } = Promise.withResolvers<void>();

    this.ready = promise;
    this.init().then(resolve);
  }

  public readonly ready: Promise<void>;

  private isReady = false;

  @action
  private async init() {
    let value;

    try {
      value = this.localStorage.getSync(this.key);
    } catch {
      value = await this.localStorage.get(this.key);
    }

    const parsedResult = this.schema.safeParse(value);
    this.value = parsedResult.success ? parsedResult.data : undefined;
    this.isReady = true;
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private get key() {
    return `PERSISTENCE_OBJECT_${this.id}`;
  }

  @observable private accessor value: Readonly<S> | undefined;

  public get<T extends keyof S>(key: T) {
    assert(this.isReady, 'not ready');
    return this.value?.[key];
  }

  @action
  public set<T extends keyof S>(key: T, value?: S[T]) {
    assert(this.isReady, 'not ready');
    this.value = { ...this.value, ...({ [key]: value } as S) };
    this.localStorage.set(this.key, this.value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
