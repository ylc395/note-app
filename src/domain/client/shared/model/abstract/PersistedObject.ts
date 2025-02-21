import type { ZodType } from 'zod';
import { action, observable, runInAction } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import { token as localStorageToken } from '#domain/client/shared/infra/localStorage';

export default class PersistedObject<S> {
  constructor(private readonly id: string, schema: ZodType<S>) {
    const parsedResult = schema.safeParse(this.localStorage.get(this.key));

    runInAction(() => {
      this.value = parsedResult.success ? parsedResult.data : undefined;
    });
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private get key() {
    return `PERSISTENCE_OBJECT_${this.id}`;
  }

  @observable private accessor value: Readonly<S> | undefined;

  public get<T extends keyof S>(key: T) {
    return this.value?.[key];
  }

  @action
  public set<T extends keyof S>(key: T, value?: S[T]) {
    this.value = { ...this.value, ...({ [key]: value } as S) };
    this.localStorage.set(this.key, this.value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
