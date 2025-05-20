import { get, set } from 'lodash-es';
import { type ZodType } from 'zod';
import { action, observable, runInAction, toJS } from 'mobx';
import assert from 'assert';

import container from '#utils/singletonContainer';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';

export default class PersistedObject<S> {
  constructor(private readonly id: string, private readonly schema: ZodType<S>, defaultValue: S) {
    const { promise, resolve } = Promise.withResolvers<void>();

    this.ready = promise;
    this.init(defaultValue).then(resolve);
  }

  public readonly ready: Promise<void>;

  private isReady = false;

  private async init(defaultValue: S) {
    let value: unknown;

    try {
      value = this.localStorage.getSync(this.key);
    } catch {
      value = await this.localStorage.get(this.key);
    }

    const parsedResult = this.schema.safeParse(value);

    runInAction(() => {
      if (parsedResult.success) {
        this.value = parsedResult.data;
      } else if (typeof value === 'object' && value) {
        for (const issue of parsedResult.error.errors) {
          set(value, issue.path, get(defaultValue, issue.path));
        }
        this.value = value as S;
      } else {
        this.value = defaultValue;
      }
    });

    this.isReady = true;
  }

  private readonly localStorage = container.resolve(localStorageToken);

  @observable.shallow private accessor value: Readonly<S> | undefined;

  private get key() {
    return `PERSISTENCE_OBJECT_${this.id}`;
  }

  public get(): S | undefined;
  public get<T extends keyof S>(key: T): S[T];
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
