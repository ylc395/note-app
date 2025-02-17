import { action, computed, observable, toJS } from 'mobx';
import { isEmpty, pick, pickBy } from 'lodash-es';

import type { ClientMemoQuery, CountQuery } from '#domain/shared/model/memo';
import TimeSelector from './TimeSelector';
import LinkSelector from './LinkSelector';
import TopicList from './TopicList';

export default class Filter {
  public readonly timeSelector = new TimeSelector();

  public readonly topicList = new TopicList();

  public readonly linkSelector = new LinkSelector();

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
      topics: toJS(this.topicList.selectedTopics),
      links: pickBy(toJS(this.linkSelector.params), (value) => !isEmpty(value)),
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
