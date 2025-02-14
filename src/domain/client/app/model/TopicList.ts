import { createQuery } from 'mobx-tanstack-query/preset';
import { action, computed, observable } from 'mobx';
import { keyBy, without } from 'lodash-es';

import { token as rpcToken } from '#domain/client/shared/infra/rpc';
import { container } from '#domain/shared/infra/singletons';
import type { EntityTypes } from '#domain/shared/model/entity';
import { TOPIC_SEPARATOR, type TopicVO } from '#domain/shared/model/content';

export interface TopicNode {
  id: string;
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

  @observable public accessor selectedTopics: string[] = [];

  @action
  public setSelected(topicNames: string[]) {
    const validNames = topicNames.filter((name) =>
      this.topicQuery.result.data?.find((topic) => topic.name === name && topic.entities.length > 0),
    );

    if (validNames.length > 0) {
      this.selectedTopics = validNames;
    }
  }

  @action
  public unselectTopic(topic: string) {
    this.selectedTopics = without(this.selectedTopics, topic);
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
  }
}
