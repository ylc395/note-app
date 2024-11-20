import { action, observable } from 'mobx';
import { container } from '#domain/shared/infra/singletons';
import { token as localStorageToken } from '#domain/client/app/infra/localStorage';
import type { EntityId } from '#domain/shared/model/entity';

export default class UIState<S = unknown> {
  private readonly localStorage = container.resolve(localStorageToken);

  constructor(private readonly entityId: EntityId) {}

  private get key() {
    return `UI_STATE_${this.entityId}`;
  }

  @observable public accessor value: Partial<S> | null = null;

  @action
  public update(state: Partial<S>) {
    this.value = { ...this.value, ...state };
    this.localStorage.set(this.key, this.value);
  }
}
