import { isPlainObject } from 'lodash-es';
import type { ZodType } from 'zod';
import { action, observable, runInAction, toJS } from 'mobx';
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

  private async init() {
    let value: unknown;

    try {
      value = this.localStorage.getSync(this.key);
    } catch {
      value = await this.localStorage.get(this.key);
    }

    const parsedResult = this.schema.safeParse(isPlainObject(value) ? value : null);

    runInAction(() => {
      this.value = parsedResult.success ? parsedResult.data : undefined;
    });

    this.isReady = true;
  }

  private readonly localStorage = container.resolve(localStorageToken);

  @observable.shallow private accessor value: Readonly<S> | undefined;

  private get key() {
    return `PERSISTENCE_OBJECT_${this.id}`;
  }

  public get(): S | undefined;
  public get<T extends keyof S>(key: T): S[T] | undefined;
  public get<T extends keyof S>(key?: T) {
    assert(this.isReady, 'not ready');

    if (key) {
      return toJS(this.value?.[key]);
    }

    return toJS(this.value);
  }

  public set(value: S): void;
  public set<T extends keyof S>(key: T, value: S[T]): void;

  @action
  public set<T extends keyof S>(key: T | S, value?: S[T]) {
    assert(this.isReady, 'not ready');

    if (value !== undefined) {
      assert(typeof key === 'string' && this.value);
      this.value = { ...this.value, ...{ [key]: value } };
    } else {
      this.value = key as S;
    }

    this.localStorage.set(this.key, this.value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
