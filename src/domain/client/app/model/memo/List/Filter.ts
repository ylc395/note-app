import { action, computed, observable, toJS } from 'mobx';
import { pick } from 'lodash-es';

import type { ClientMemoQuery } from '#domain/shared/model/memo';
import TimeSelector from './TimeSelector';
import type TopicList from '../../TopicList';

export default class Filter {
  constructor(options: { topicList: TopicList }) {
    this.topicList = options.topicList;
  }

  public readonly timeSelector = new TimeSelector();

  public readonly topicList: TopicList;

  @observable public accessor keyword: string | undefined;

  @observable.ref public accessor sortOptions: Readonly<Pick<ClientMemoQuery, 'order' | 'orderBy'>> = {
    orderBy: 'createdAt',
    order: 'desc',
  };

  @computed
  public get params() {
    return {
      ...this.sortOptions,
      durations: this.timeSelector.selectedDurations,
      keyword: this.keyword || undefined,
      tags: toJS(this.topicList.selectedTopics),
    };
  }

  @computed
  public get countParams() {
    return pick(this.params, ['durations', 'tags']);
  }

  @action
  public setOrder(value: Filter['sortOptions']) {
    this.sortOptions = value;
  }
}
