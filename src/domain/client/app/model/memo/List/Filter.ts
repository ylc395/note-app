import { action, computed, observable, toJS } from 'mobx';

import type { ClientMemoQuery } from '#domain/shared/model/memo';
import TimeSelector from './TimeSelector';

export default class Filter {
  public readonly timeSelector = new TimeSelector();

  @observable public accessor order: ClientMemoQuery['order'] = 'desc';

  @computed
  public get params() {
    return {
      order: this.order,
      durations: toJS(this.timeSelector.selectedDurations),
    };
  }

  @computed
  public get isEmpty() {
    return this.params.durations.length === 0;
  }

  @action
  public toggleOrder() {
    this.order = this.order === 'desc' ? 'asc' : 'desc';
  }
}
