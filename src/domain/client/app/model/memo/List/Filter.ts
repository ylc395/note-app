import { action, computed, observable, toJS } from 'mobx';
import { pick } from 'lodash-es';
import { createQuery } from 'mobx-tanstack-query/preset';

import type { ClientMemoQuery } from '#domain/shared/model/memo';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import TimeSelector from './TimeSelector';
import type TopicList from '../../TopicList';
import DomainEventBus from '../EventBus';

export default class Filter {
  constructor(options: { topicList: TopicList }) {
    this.topicList = options.topicList;

    this.eventBus.on([DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Removed], () =>
      this.linkSetQuery.invalidate(),
    );
  }

  private readonly eventBus = container.resolve(DomainEventBus);

  private readonly remote = container.resolve(rpcToken);

  public readonly timeSelector = new TimeSelector();

  public readonly topicList: TopicList;

  public readonly linkSetQuery = createQuery(() => this.remote.memo.queryLinkSet.query(), {
    queryKey: ['memos', 'linkSet'],
  });

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
