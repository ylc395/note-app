import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { TopicVO } from '#domain/shared/model/topic';
import TopicTree from '../model/topic/Tree';

export interface TopicNode {
  id: string;
  name: string;
  entities: TopicVO['entities'];
  children: TopicNode[];
}

export default class TopicService {
  private readonly remote = container.resolve(rpcToken);

  public readonly globalTopicTree = new TopicTree();

  public readonly getTopics = (name: string) =>
    createQuery(() => this.remote.content.queryTopics.query({ name }), { queryKey: ['topics', { name }] });
}
