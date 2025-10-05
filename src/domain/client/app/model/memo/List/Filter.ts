import { action, computed, observable, toJS } from 'mobx';
import { pick } from 'lodash-es';

import type { ClientMemoQuery, CountQuery } from '#domain/shared/model/memo';
import TimeSelector from './TimeSelector';

export default class Filter {
  public readonly timeSelector = new TimeSelector();

  @action
  public setActive(value: boolean) {
    this.timeSelector.setActive(value);
  }

  @observable public accessor keyword: string | undefined;

  @observable.ref public accessor sortOptions: Readonly<Pick<ClientMemoQuery, 'order' | 'orderBy'>> = {
    orderBy: 'createdAt',
    order: 'desc',
  };

  @computed
  public get params(): ClientMemoQuery {
    return {
      ...toJS(this.sortOptions),
      keyword: this.keyword || undefined,
      durations: toJS(this.timeSelector.selectedDurations),
    };
  }

  @computed
  public get countParams(): CountQuery {
    return pick(this.params, ['durations', 'topics', 'links']);
  }

  @action
  public setOrder(value: Filter['sortOptions']) {
    this.sortOptions = value;
  }
}
