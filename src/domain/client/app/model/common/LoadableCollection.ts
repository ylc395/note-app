import { computed, observable } from 'mobx';
import { keyBy } from 'lodash-es';

import Collection from './Collection';

export default abstract class LoadableCollection<T extends { id: string }> extends Collection<T> {
  constructor() {
    super();
    this.load();
  }

  @observable.ref protected accessor loadingController: AbortController | undefined;

  protected abstract queryItems(): Promise<T[]>;

  @computed
  public get isLoading() {
    return Boolean(this.loadingController);
  }

  public async load() {
    this.loadingController?.abort();

    const controller = new AbortController();
    this.loadingController = controller;

    try {
      const items = await this.queryItems();

      Object.assign(
        this.itemsMap,
        keyBy(items, ({ id }) => id),
      );
    } catch (e) {
      if (!controller.signal.aborted) {
        throw e;
      }
    } finally {
      if (this.loadingController === controller) {
        this.loadingController = undefined;
      }
    }
  }

  public destroy() {
    this.loadingController?.abort();
  }
}
