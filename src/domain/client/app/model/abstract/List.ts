import { action, computed, observable, runInAction } from 'mobx';
import { keyBy } from 'lodash-es';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { EntityId } from '#domain/shared/model/entity';

export default abstract class List<T extends { id: EntityId }> {
  constructor() {
    this.init();
  }

  protected readonly remote = container.resolve(rpcToken);

  protected abstract readonly sort: (item1: T, it: T) => number;

  private isDestroyed = false;

  private abortController?: AbortController;

  @observable.ref public accessor error: unknown;

  @observable.shallow protected accessor itemsMap: Record<EntityId, T> = {};

  protected abstract load(signal: AbortController['signal'], id: T['id']): Promise<T>;
  protected abstract load(signal: AbortController['signal']): Promise<T[]>;

  public async init(id?: T['id']) {
    if (id && !this.itemsMap[id]) {
      return;
    }

    this.abortController?.abort();

    const controller = new AbortController();
    this.abortController = controller;

    try {
      if (id) {
        const item = await this.load(controller.signal, id);

        runInAction(() => {
          this.itemsMap[id] = item;
        });
      } else {
        const items = await this.load(controller.signal);

        runInAction(() => {
          this.itemsMap = keyBy(items, ({ id }) => id);
        });
      }
    } catch (error) {
      if (this.abortController === controller && !this.isDestroyed) {
        runInAction(() => {
          this.error = error;
        });
      }
    }

    if (this.abortController === controller) {
      this.abortController = undefined;
    }
  }

  @computed
  public get value() {
    return Object.values<T>(this.itemsMap).sort(this.sort);
  }

  protected removeById(id: T['id']) {
    delete this.itemsMap[id];
  }

  @action
  protected add(item: T) {
    this.itemsMap[item.id] = item;
  }

  public destroy() {
    this.isDestroyed = true;
    this.abortController?.abort();
  }
}
