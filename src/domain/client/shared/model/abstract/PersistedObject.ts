import { get, isObject, set } from 'lodash-es';
import { type ZodType } from 'zod';
import assert from 'assert';
import { action, observable, ObservableMap, runInAction } from 'mobx';

import container from '#utils/singletonContainer';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';
import { untrack } from 'solid-js/web';

export default class PersistedMap<S extends object> {
  constructor(private readonly id: string, private readonly schema: ZodType<S>, defaultValue: S) {
    this.init(defaultValue);
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private accessor map = new ObservableMap();

  @observable public accessor isReady = false;

  private async init(defaultValue: S) {
    let value = await this.localStorage.get(this.key);
    const parsedResult = this.schema.safeParse(value);

    if (!isObject(value)) {
      value = defaultValue;
    }

    if (parsedResult.error) {
      for (const issue of parsedResult.error.errors) {
        set(value as object, issue.path, get(defaultValue, issue.path));
      }
    }

    runInAction(() => {
      this.map.replace(value as object);
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

  @action
  public set<T extends keyof S>(key: T, value: S[T]) {
    assert(this.isReady, 'not ready');
    this.map.set(key, value);

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
