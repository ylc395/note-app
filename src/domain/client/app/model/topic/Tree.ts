import { createQuery } from 'mobx-tanstack-query/preset';

import container from '#utils/singletonContainer';
import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { TOPIC_SEPARATOR, type TopicVO } from '#domain/shared/model/topic';
import { keyBy } from 'lodash-es';
import { action, observable } from 'mobx';

export interface TopicNode {
  id: string;
  name: string;
  entities: TopicVO['entities'];
  children: TopicNode[];
}

export default class TopicTree {
  private readonly remote = container.resolve(rpcToken);

  @action
  public readonly toggleExpand = (id: TopicNode['id']) => {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  };

  @observable
  public accessor expandedIds = new Set<TopicNode['id']>();

  public readonly data = createQuery(
    async () => {
      const topicList = await this.remote.content.queryTopics.query();
      const topics = keyBy(topicList, ({ name }) => name);
      const names = Object.keys(topics).map((name) => name.split(TOPIC_SEPARATOR));

      const nodes: TopicNode[] = [];
      const nodesMap: Record<string, TopicNode> = {};

      for (const splittedName of names) {
        let parent: TopicNode | undefined;
        let path = '';

        for (const name of splittedName) {
          path += `${path ? TOPIC_SEPARATOR : ''}${name}`;
          let node = nodesMap[path];

          if (node) {
            parent = node;
            continue;
          }

          node = nodesMap[path] = {
            id: path,
            name,
            children: [],
            entities: topics[path]?.entities ?? [],
          };

          if (parent) {
            parent.children.push(node);
          } else {
            nodes.push(node);
          }

          parent = node;
        }
      }

      return nodes;
    },
    { queryKey: ['topics'] },
  );
}
