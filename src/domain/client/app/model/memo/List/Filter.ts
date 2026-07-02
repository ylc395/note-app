import { action, computed, observable, reaction, toJS } from 'mobx';

import type { ClientMemoQuery } from '#domain/shared/model/memo';
import TimeSelector from './TimeSelector';
import assert from 'assert';

export default class Filter {
  constructor(private options: { canBeRandom: () => boolean }) {
    reaction(
      () => [this.params, this.order],
      () => {
        if (this.isRandom) {
          this.initRandomSeed();
          this.setKeyword('');
        }
      },
    );
  }

  public readonly timeSelector = new TimeSelector();

  @observable public accessor randomSeed:
    | {
        seed: number;
        offset: number;
      }
    | undefined;

  @observable public accessor order: ClientMemoQuery['order'] | 'random' = 'desc';

  @computed
  public get isRandom() {
    return this.order === 'random';
  }

  public keyword?: string;

  @action
  private initRandomSeed() {
    this.randomSeed = {
      seed: crypto.getRandomValues(new Uint32Array(1))[0]!,
      offset: 0,
    };
  }

  @computed
  public get params() {
    return {
      limit: 30,
      order: this.order === 'random' ? undefined : this.order,
      durations: toJS(this.timeSelector.selectedDurations),
    };
  }

  public isSearching() {
    return this.keyword && !this.isRandom;
  }

  @computed
  public get canBeRandom() {
    return this.options.canBeRandom();
  }

  @action
  public setOrder(order: 'desc' | 'asc' | 'random') {
    if (order === 'random') {
      assert(this.canBeRandom);
    }

    this.order = order;
  }

  @action
  public shuffle() {
    assert(this.isRandom && this.randomSeed);
    this.randomSeed.offset += 10;
  }

  @action
  public setKeyword(value: string) {
    this.keyword = value;
  }
}
