import { type ZodType } from 'zod';
import assert from 'assert';
import { action, observable, ObservableMap, runInAction } from 'mobx';

import container from '#utils/singletonContainer';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';
import { untrack } from 'solid-js/web';
import { isObject } from 'lodash-es';

export default class PersistedMap<S extends object> {
  constructor(private readonly id: string, private readonly schema: ZodType<S>) {
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

  private get key() {
    return `PERSISTENCE_OBJECT_${this.id}`;
  }

  public get<T extends keyof S>(key: T): S[T] {
    assert(this.isReady, 'not ready');
    return this.map.get(key);
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

  public toObject() {
    return Object.fromEntries(this.map) as S;
  }

  public clear() {
    this.map.clear();
    this.localStorage.delete(this.key);
  }
}
