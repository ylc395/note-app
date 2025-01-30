import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable } from 'mobx';
import { keyBy, without } from 'lodash-es';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import type { EntityTypes } from '#domain/shared/model/entity';
import { container } from '#domain/shared/infra/singletons';
import { TOPIC_SEPARATOR, type TopicVO } from '#domain/shared/model/content';

export interface TopicNode {
  name: string;
  entities: TopicVO['entities'];
  children: TopicNode[];
}

export default class TopicList {
  constructor(entityType?: EntityTypes) {
    this.topicQuery = createQuery(() => this.remote.content.queryTopics.query({ type: entityType }), {
      queryKey: ['topics', entityType],
    });
  }

  private readonly remote = container.resolve(rpcToken);

  public readonly topicQuery;

  public destroy() {
    this.topicQuery.destroy();
  }

  @observable public accessor selectedTopics: string[] | undefined;

  @action
  public toggle(topic: TopicNode, add?: boolean) {
    if (this.selectedTopics?.includes(topic.name)) {
      const topics = without(this.selectedTopics, topic.name);
      this.selectedTopics = topics.length > 0 ? topics : undefined;
    } else {
      this.selectedTopics = add ? [...(this.selectedTopics ?? []), topic.name] : [topic.name];
    }
  }

  @computed
  public get tree(): TopicNode[] | null {
    if (!this.topicQuery.result.data) {
      return null;
    }

    const topics = keyBy(this.topicQuery.result.data, ({ name }) => name);
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
          continue;
        }

        node = nodesMap[path] = {
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
  }
}
