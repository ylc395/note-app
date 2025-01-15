import type { ZodType } from 'zod';
import { action, observable, runInAction } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';

export default class UIState<S = unknown> {
  constructor(private readonly id: string, schema: ZodType<S>) {
    const parsedResult = schema.safeParse(this.localStorage.get(this.key));

    runInAction(() => {
      this.value = parsedResult.success ? parsedResult.data : {};
    });
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private get key() {
    return `UI_STATE_${this.id}`;
  }

  @observable public accessor value: Partial<S> = {};

  @action
  public update(state: Partial<S>) {
    Object.assign(this.value, state);

    if (Object.values(this.value).every((value) => value === undefined)) {
      this.clear();
      return;
    }

    this.localStorage.set(this.key, this.value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
