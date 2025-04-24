import container from '#utils/singletonContainer';
import { EntityTypes } from '#domain/shared/model/entity';
import TopicList from '../../TopicList';
import DomainEventBus from '../EventBus';

export default class MemoTopicList extends TopicList {
  constructor() {
    super(EntityTypes.Memo);

    this.eventBus.on(
      [DomainEventBus.eventNames.Created, DomainEventBus.eventNames.Updated, DomainEventBus.eventNames.Removed],
      () => this.topicQuery.invalidate(),
    );
  }

  private readonly eventBus = container.resolve(DomainEventBus);
}
