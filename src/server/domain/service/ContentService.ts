import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import type { UnistNode } from 'unist-util-visit/lib';
import type { Link as MdAstLinkNode } from 'mdast';
import intersectionWith from 'lodash/intersectionWith';
import groupBy from 'lodash/groupBy';

import { is, parseUrl } from 'infra/markdown/utils';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from 'infra/markdown/topic';
import type {
  ContentUpdate,
  EntityWithSnippet,
  Link,
  HighlightPosition,
  Topic,
  TopicQuery,
  TopicVO,
  TopicDTO,
} from 'model/content';
import { EntityTypes, type EntityLocator, EntityId } from 'model/entity';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class ContentService extends BaseService {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  private extractTopics(entity: EntityLocator) {
    const topics: Topic[] = [];
    const createdAt = Date.now();

    return {
      visitor: (node: UnistNode) => {
        if (!is<TopicNode>(node, 'topic') || !node.position) {
          return;
        }

        topics.push({
          ...entity,
          position: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 },
          name: node.value,
          createdAt,
        });
      },
      done: async () => {
        if (topics.length === 0) {
          return;
        }

        await this.transaction(async () => {
          await this.repo.contents.removeTopics(entity);
          await this.repo.contents.createTopics(topics);
        });
      },
    };
  }

  private extractLinks(entity: EntityLocator) {
    const links: Link[] = [];
    const createdAt = Date.now();

    return {
      visitor: (node: UnistNode) => {
        if (!is<MdAstLinkNode>(node, 'link') || !node.position || !node.url) {
          return;
        }

        const parsed = parseUrl(node.url);

        if (parsed) {
          links.push({
            from: {
              ...entity,
              position: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 },
            },
            to: parsed,
            createdAt,
          });
        }
      },
      done: async () => {
        if (links.length === 0) {
          return;
        }

        const targets = await this.entityService.filterAvailable(links.map(({ to }) => to));

        await this.transaction(async () => {
          await this.repo.contents.removeLinks(entity, 'from');
          await this.repo.contents.createLinks(
            intersectionWith(links, targets, ({ to }, { entityId: id }) => to.entityId === id),
          );
        });
      },
    };
  }

  // todo: used in http server, not ipc server
  async extract({ content, ...entity }: ContentUpdate) {
    const mdAst = fromMarkdown(content, { mdastExtensions: [topicExtension], extensions: [topicTokenExtension] });
    const reducers = [this.extractLinks, this.extractTopics].map((cb) => cb.call(this, entity));

    visit(mdAst, (node) => reducers.forEach(({ visitor }) => visitor(node)));

    for (const { done } of reducers) {
      await done();
    }
  }

  async queryTopicNames() {
    return this.repo.contents.findAllTopicNames({ orderBy: 'updatedAt' });
  }

  async queryTopics(q: TopicQuery) {
    const topics = await this.repo.contents.findAllTopics(q);
    const topicsGroup = groupBy(topics, 'name');
    const result: TopicVO[] = [];
    const titles = await this.entityService.getEntityTitles(topics);
    const snippets = await this.getSnippets(topics);

    for (const [name, topics] of Object.entries(topicsGroup)) {
      const topicVO: TopicVO = {
        updatedAt: 0,
        name,
        entities: [],
      };

      for (const topic of topics) {
        const snippet = snippets[topic.entityType][topic.entityId]![`${topic.position.start},${topic.position.end}`]!;

        topicVO.entities.push({
          entityId: topic.entityId,
          entityType: topic.entityType,
          title: titles[topic.entityType][topic.entityId] || '',
          ...snippet,
        });

        if (topic.createdAt > topicVO.updatedAt) {
          topicVO.updatedAt = topic.createdAt;
        }
      }
      result.push(topicVO);
    }
    return result;
  }

  private async getSnippets(entities: (EntityLocator & { position: HighlightPosition })[]) {
    const result: Record<
      EntityTypes,
      Record<EntityId, Record<`${number},${number}`, Pick<EntityWithSnippet, 'snippet' | 'highlight'>>>
    > = {
      [EntityTypes.Note]: {},
      [EntityTypes.Material]: {},
      [EntityTypes.Memo]: {},
      [EntityTypes.MaterialAnnotation]: {},
    };

    const groups = groupBy(entities, ({ entityId, entityType }) => `${entityType}-${entityId}`);

    for await (const { content, entityId, entityType } of this.repo.entities.findAllBody(entities)) {
      const positions = groups[`${entityType}-${entityId}`]!;

      for (const { position } of positions) {
        if (!result[entityType][entityId]) {
          result[entityType][entityId] = {};
        }

        result[entityType][entityId]![`${position.start},${position.end}`] = ContentService.extractSnippet(
          content,
          position,
        );
      }
    }
    return result;
  }

  async createTopics(topics: TopicDTO[]) {
    const createdAt = Date.now();
    const _topics = topics.map((topic) => ({ ...topic, createdAt }));
    await this.repo.contents.createTopics(_topics);
  }

  private static extractSnippet(content: string, pos: HighlightPosition) {
    const snippet = content.slice(Math.max(0, pos.start - 20), Math.min(content.length, pos.end + 20));
    return { snippet, highlight: { start: 20, end: 20 + (pos.end - pos.start) } };
  }
}
