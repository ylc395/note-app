import { type ZodType } from 'zod';
import assert from 'assert';
import { action, observable, ObservableMap, runInAction } from 'mobx';
import { untrack } from 'solid-js/web';
import { debounce, isObject } from 'lodash-es';

import container from '#utils/singletonContainer';
import { token as localStorageToken } from '#domain/client/shared/infra/kvStorage';

export type DataType<T> = T extends PersistedMap<infer Data> ? Data : unknown;

export default class PersistedMap<S extends object> {
  constructor(private readonly key: string, private readonly schema: ZodType<S>) {
    this.init();
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private accessor map = new ObservableMap();

  @observable public accessor isReady = false;

  private async init() {
    let value = await this.localStorage.get(this.key);

    if (!isObject(value)) {
      value = {};
    }

    const parsedResult = this.schema.parse(value);

    runInAction(() => {
      this.map.replace(parsedResult);
      this.isReady = true;
    });
  }

  public get<T extends keyof S>(key: T): S[T];
  public get<T extends keyof S>(key: T, defaultValue: NonNullable<S[T]>): NonNullable<S[T]>;
  public get<T extends keyof S>(key: T, defaultValue?: S[T]): S[T] {
    if (typeof defaultValue === 'undefined') {
      assert(this.isReady, 'not ready');
    }
    return this.map.get(key) ?? defaultValue;
  }

  public set<T extends keyof S>(key: T, value: S[T]): this;
  public set(values: Partial<S>): this;
  @action
  public set<T extends keyof S>(key: T | Partial<S>, value?: S[T]) {
    assert(this.isReady, 'not ready');

    if (typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol') {
      this.map.set(key, value);
    } else {
      this.map.merge(key);
    }

    untrack(() => {
      this.localStorage.set(this.key, this.toObject());
    });

    return this;
  }

  public readonly save = debounce(() => {
    this.localStorage.set(this.key, this.toObject());
  }, 500);

  public toObject() {
    return Object.fromEntries(this.map) as S;
  }

  public clear() {
    this.map.clear();
    this.localStorage.delete(this.key);
  }
}
