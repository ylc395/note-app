import { computed, observable } from 'mobx';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import EventBus from '#domain/client/app/infra/EventBus';
import { container } from '#domain/shared/infra/singletons';
import type { EntityId, EntityTypes } from '#domain/shared/model/entity';

import { EventNames, type Events } from './events';

export { EventNames } from './events';

// 一个 EditableEntity 可以被多个 Editor 引用
export default abstract class Editable<T = unknown> extends EventBus<Events> {
  protected readonly remote = container.resolve(rpcToken);

  protected abstract readonly entityType: EntityTypes;

  constructor(private readonly entityId: EntityId) {
    super(`Editable-${entityId}`);
    this.load();
  }

  public get entityLocator() {
    return { entityId: this.entityId, entityType: this.entityType };
  }

  public abstract entity?: T;

  protected abstract _load(abortSignal: AbortController['signal']): Promise<void>;

  public load = async () => {
    const abortController = new AbortController();

    this.loadingController?.abort(Editable.cancelLoadingReason);
    this.loadingController = new AbortController();

    try {
      await this._load(abortController.signal);
    } catch (error) {
      if (error === Editable.cancelLoadingReason) {
        return;
      }

      throw error;
    } finally {
      this.loadingController = undefined;
    }
  };

  @observable private accessor loadingController: { abort: (reason: unknown) => void } | undefined;

  @computed
  public get isLoading() {
    return Boolean(this.loadingController);
  }

  public destroy() {
    this.emit(EventNames.Destroyed);
    this.loadingController?.abort(Editable.cancelLoadingReason);
    this.clearListeners();
  }

  private static cancelLoadingReason = Symbol('cancel');
}
