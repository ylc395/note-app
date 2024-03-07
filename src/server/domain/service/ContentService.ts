import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import { container } from 'tsyringe';
import type { Link as MdAstLinkNode, Image as MdAstImageNode, Node as UnistNode } from 'mdast';
import { groupBy, uniqBy, map } from 'lodash-es';

import { is, parseUrl } from '@domain/infra//markdown/utils.js';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from '@domain/infra//markdown/syntax/topic.js';
import type {
  ContentUpdatedEvent,
  EntityWithSnippet,
  Link,
  HighlightPosition,
  // TopicQuery,
  // TopicVO,
  // TopicDTO,
  LinkDTO,
  // LinkToQuery,
  InlineTopic,
} from '@domain/model/content.js';
import type { EntityId, EntityLocator } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

export default class ContentService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  onModuleInit() {
    // if (!IS_IPC) {
    // only extract on non-ipc server. ipc server will receive everything from render process, no need to do extracting itself
    // this.eventBus.on('contentUpdated', this.extract);
    // }
  }

  private extractTopics(entity: ContentUpdatedEvent) {
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
          await this.repo.contents.removeTopicsOf(entity.entityId);
          await this.repo.contents.createTopics(topics);
        });
      },
    };
  }

  private extractLinksAndMedias(entity: ContentUpdatedEvent) {
    const links: Link[] = [];

    return {
      visitor: (node: UnistNode) => {
        if (!(is<MdAstLinkNode>(node, 'link') || is<MdAstImageNode>(node, 'image')) || !node.position || !node.url) {
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

        await this.transaction(async () => {
          await this.repo.contents.removeLinks(entity.entityId, 'from');
          await this.repo.contents.createLinks(links); // don't do filtering here.
        });
      },
    };
  }

  private readonly extract = async (entity: ContentUpdatedEvent) => {
    const mdAst = fromMarkdown(entity.content, {
      mdastExtensions: [topicExtension],
      extensions: [topicTokenExtension],
    });

    const reducers = [this.extractLinksAndMedias, this.extractTopics].map((cb) => cb.call(this, entity));

    visit(mdAst, (node) => reducers.forEach(({ visitor }) => visitor(node)));

    for (const { done } of reducers) {
      await done();
    }
  };

  async queryTopicNames() {
    return this.repo.contents.findAvailableTopicNames({ orderBy: 'updatedAt' });
  }

  // async queryTopics(q: TopicQuery) {
  //   const topics = await this.repo.contents.findAvailableTopics(q);
  //   const topicsGroup = groupBy(topics, 'name');
  //   const result: TopicVO[] = [];
  //   const titles = await this.entityService.getNormalizedTitles(topics);
  //   const snippets = await this.getSnippets(topics);

  //   for (const [name, topics] of Object.entries(topicsGroup)) {
  //     const topicVO: TopicVO = {
  //       updatedAt: 0,
  //       name,
  //       entities: [],
  //     };

  //     for (const topic of topics) {
  //       const snippet = snippets[topic.entityId]![`${topic.position.start},${topic.position.end}`]!;

  //       topicVO.entities.push({
  //         entityId: topic.entityId,
  //         entityType: topic.entityType,
  //         title: titles[topic.entityId] || '',
  //         ...snippet,
  //       });

  //       if (topic.createdAt > topicVO.updatedAt) {
  //         topicVO.updatedAt = topic.createdAt;
  //       }
  //     }
  //     result.push(topicVO);
  //   }
  //   return result;
  // }

  // async queryLinkTos(q: LinkToQuery) {
  //   const links = await this.repo.contents.findAllLinkTos(q);
  //   const froms = await this.entityService.filterAvailable(map(links, 'from'));
  //   const snippets = await this.getSnippets(froms);
  //   const titles = await this.entityService.getNormalizedTitles(froms);

  //   return froms.map(({ entityId, entityType, position }) => ({
  //     entityId,
  //     entityType,
  //     title: titles[entityId]!,
  //     ...snippets[entityId]![`${position.start},${position.end}`]!,
  //   }));
  // }

  private async getSnippets(entities: (EntityLocator & { position: HighlightPosition })[]) {
    const result: Record<
      EntityId,
      Record<`${number},${number}`, Pick<EntityWithSnippet, 'snippet' | 'highlight'>>
    > = {};

    const groups = groupBy(entities, ({ entityId, entityType }) => `${entityType}-${entityId}`);
    const bodyIterator = this.repo.entities.findAllBody(EntityService.toIds(entities));

    for await (const { content, id } of bodyIterator) {
      const positions = groups[id]!;

      for (const { position } of positions) {
        if (!result[id]) {
          result[id] = {};
        }

        result[id]![`${position.start},${position.end}`] = ContentService.extractSnippet(content, position);
      }
    }
    return result;
  }

  // async createTopics(topics: TopicDTO[]) {
  //   const createdAt = Date.now();

  //   await this.entityService.assertAvailableEntities(topics);

  //   await this.transaction(async () => {
  //     const _topics = topics.map((topic) => ({ ...topic, createdAt }));

  //     for (const topic of uniqBy(topics, 'entityId')) {
  //       await this.repo.contents.removeTopicsOf(topic);
  //     }
  //     await this.repo.contents.createTopics(_topics);
  //   });
  // }

  async createLinks(links: LinkDTO[]) {
    const createdAt = Date.now();
    const _links = links.map((link) => ({ ...link, createdAt }));

    await this.transaction(async () => {
      for (const link of uniqBy(map(links, 'from'), 'entityId')) {
        await this.repo.contents.removeLinks(link.entityId, 'from');
      }
      await this.repo.contents.createLinks(_links);
    });
  }

  private static extractSnippet(content: string, pos: HighlightPosition) {
    const snippet = content.slice(Math.max(0, pos.start - 20), Math.min(content.length, pos.end + 20));
    return { snippet, highlight: { start: 20, end: 20 + (pos.end - pos.start) } };
  }
}
