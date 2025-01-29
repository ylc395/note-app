import { container } from '#domain/shared/infra/singletons';
import { EntityTypes } from '#domain/shared/model/entity';

import DomainEventBus from '../model/memo/EventBus';
import MemoView from '../model/memo/MemoView';
import TopicList from '../model/TopicList';

export default class MemoService {
  constructor() {
    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated, DomainEventBus.eventNames.Removed],
      () => this.topicList.topicQuery.invalidate(),
    );
  }

  public readonly rootMemo = new MemoView();

  public readonly topicList = new TopicList(EntityTypes.Memo);

  private readonly eventBus = container.resolve(DomainEventBus);
}
