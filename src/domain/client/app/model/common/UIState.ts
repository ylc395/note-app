import type { ZodType } from 'zod';
import { action, observable, runInAction } from 'mobx';

import { container } from '#domain/shared/infra/singletons';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';

export default class UIState<S = unknown> {
  constructor(private readonly id: string, schema: ZodType<S>) {
    const parsedResult = schema.safeParse(this.localStorage.get(this.key));

    runInAction(() => {
      this.value = parsedResult.success ? parsedResult.data : null;
    });
  }

  private readonly localStorage = container.resolve(localStorageToken);

  private get key() {
    return `UI_STATE_${this.id}`;
  }

  @observable public accessor value: Partial<S> | null = null;

  @action
  public update(state: Partial<S>) {
    this.value = { ...this.value, ...state };
    this.localStorage.set(this.key, this.value);
  }

  public clear() {
    this.localStorage.delete(this.key);
  }
}
