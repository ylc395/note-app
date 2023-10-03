import { Inject, Injectable, type OnModuleInit, forwardRef } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import type { UnistNode } from 'unist-util-visit/lib';
import type { Link as MdAstLinkNode } from 'mdast';
import intersectionWith from 'lodash/intersectionWith';
import groupBy from 'lodash/groupBy';
import uniqBy from 'lodash/uniqBy';
import map from 'lodash/map';

import { is, parseUrl } from 'infra/markdown/utils';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from 'infra/markdown/syntax/topic';
import {
  mdastExtension as multimediaExtension,
  type Multimedia as MultimediaNode,
} from 'infra/markdown/syntax/multimedia';
import { IS_IPC } from 'infra/Runtime';
import {
  type ContentUpdatedEvent,
  type EntityWithSnippet,
  type Link,
  type HighlightPosition,
  type TopicQuery,
  type TopicVO,
  type TopicDTO,
  type LinkDTO,
  type LinkToQuery,
  type InlineTopicDTO,
  type InlineTopic,
  type ContentEntityLocator,
  type ContentEntityTypes,
  isInlineTopic,
} from 'model/content';
import { EntityTypes, type EntityId, EntityLocator } from 'model/entity';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class ContentService extends BaseService implements OnModuleInit {
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  onModuleInit() {
    if (!IS_IPC) {
      // only extract on non-ipc server. ipc server will receive everything from render process, no need to do extracting itself
      this.eventBus.on('contentUpdated', this.extract);
    }
  }

  private extractInlineTopics(entity: ContentUpdatedEvent) {
    const topics: InlineTopic[] = [];

    return {
      visitor: (node: UnistNode) => {
        if (!is<TopicNode>(node, 'topic') || !node.position) {
          return;
        }

        topics.push({
          ...entity,
          position: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 },
          name: node.value,
          createdAt: entity.updatedAt,
        });
      },
      done: async () => {
        if (topics.length === 0) {
          return;
        }

        await this.transaction(async () => {
          await this.repo.contents.removeTopics(entity, true);
          await this.repo.contents.createTopics(topics);
        });
      },
    };
  }

  private extractLinks(entity: ContentUpdatedEvent) {
    const links: Link[] = [];

    return {
      visitor: (node: UnistNode) => {
        if (
          !(is<MdAstLinkNode>(node, 'link') || is<MultimediaNode>(node, 'multimedia')) ||
          !node.position ||
          !node.url
        ) {
          return;
        }

        const parsed = parseUrl(node.url);

        if (!parsed) {
          return;
        }

        links.push({
          from: {
            ...entity,
            position: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 },
          },
          to: parsed,
          createdAt: entity.updatedAt,
        });
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

  private readonly extract = async (entity: ContentUpdatedEvent | ContentEntityLocator) => {
    const content = 'content' in entity ? entity.content : (await this.repo.entities.findBody(entity))!;
    const mdAst = fromMarkdown(content, {
      mdastExtensions: [topicExtension, multimediaExtension],
      extensions: [topicTokenExtension],
    });

    const reducers = [this.extractLinks, this.extractInlineTopics].map((cb) =>
      cb.call(this, { content, updatedAt: Date.now(), ...entity }),
    );

    visit(mdAst, (node) => reducers.forEach(({ visitor }) => visitor(node)));

    for (const { done } of reducers) {
      await done();
    }
  };

  async queryTopicNames() {
    return this.repo.contents.findAvailableTopicNames({ orderBy: 'updatedAt' });
  }

  async queryTopics(q: TopicQuery) {
    const topics = await this.repo.contents.findAvailableTopics(q);
    const topicsGroup = groupBy(topics, 'name');
    const result: TopicVO[] = [];
    const titles = await this.entityService.getEntityTitles(topics);
    const snippets = await this.getSnippets(topics.filter(isInlineTopic));

    for (const [name, topics] of Object.entries(topicsGroup)) {
      const topicVO: TopicVO = {
        updatedAt: 0,
        name,
        entities: [],
      };

      for (const topic of topics) {
        const snippet = isInlineTopic(topic)
          ? snippets[topic.entityType][topic.entityId]![`${topic.position.start},${topic.position.end}`]!
          : null;

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

  async queryLinkTos(q: LinkToQuery) {
    const links = await this.repo.contents.findAllLinkTos(q);
    const froms = map(links, 'from');
    const snippets = await this.getSnippets(froms);
    const titles = await this.entityService.getEntityTitles(froms);

    return froms.map(({ entityId, entityType, position }) => ({
      entityId,
      entityType,
      title: titles[entityType][entityId]!,
      ...snippets[entityType][entityId]![`${position.start},${position.end}`]!,
    }));
  }

  private async getSnippets(entities: (EntityLocator & { position: HighlightPosition })[]) {
    const result: Record<
      ContentEntityTypes,
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

  async createTopics(topics: TopicDTO[] | InlineTopicDTO[]) {
    const createdAt = Date.now();

    await this.entityService.assertAvailableEntities(topics);

    await this.transaction(async () => {
      const _topics = topics.map((topic) => ({ ...topic, createdAt }));

      for (const topic of uniqBy(topics, 'entityId')) {
        await this.repo.contents.removeTopics(topic, isInlineTopic(topics[0]!));
      }
      await this.repo.contents.createTopics(_topics);
    });
  }

  async createLinks(links: LinkDTO[]) {
    const entities = [...map(links, 'from'), ...map(links, 'to')];

    await this.entityService.assertAvailableEntities(entities);

    const createdAt = Date.now();
    const _links = links.map((link) => ({ ...link, createdAt }));

    await this.transaction(async () => {
      for (const link of uniqBy(map(links, 'from'), 'entityId')) {
        await this.repo.contents.removeLinks(link, 'from');
      }
      await this.repo.contents.createLinks(_links);
    });
  }

  private static extractSnippet(content: string, pos: HighlightPosition) {
    const snippet = content.slice(Math.max(0, pos.start - 20), Math.min(content.length, pos.end + 20));
    return { snippet, highlight: { start: 20, end: 20 + (pos.end - pos.start) } };
  }
}
