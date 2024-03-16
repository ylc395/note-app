import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import { container, singleton } from 'tsyringe';
import assert from 'assert';
import type { Link as MdAstLinkNode, Image as MdAstImageNode, Node as UnistNode } from 'mdast';
import { groupBy, differenceWith, intersectionWith, uniqBy } from 'lodash-es';

import { is, parseUrl } from '@domain/infra/markdown/utils.js';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from '@domain/infra//markdown/syntax/topic.js';
import {
  EventNames,
  type ContentUpdatedEvent,
  type TopicRecord,
  type Link,
  type TopicVO,
  type LinkSourceVO,
  type LinkTargetVO,
  type Source,
} from '@domain/model/content.js';
import type { EntityId } from '@domain/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class ContentService extends BaseService {
  constructor() {
    super();
    this.eventBus.on(EventNames.ContentUpdated, this.extract);
  }

  private readonly entityService = container.resolve(EntityService);

  private static parseMarkdown(content: string) {
    return fromMarkdown(content, {
      mdastExtensions: [topicExtension],
      extensions: [topicTokenExtension],
    });
  }

  private readonly extract = async (entity: ContentUpdatedEvent) => {
    const mdAst = ContentService.parseMarkdown(entity.content);
    const reducers = [this.extractLinksAndMedias, this.extractTopics].map((cb) => cb.call(this, entity));

    visit(mdAst, (node) => reducers.forEach(({ visitor }) => visitor(node)));

    for (const { done } of reducers) {
      await this.transaction(done);
    }
  };

  private extractTopics(entity: ContentUpdatedEvent) {
    const topics = new Set<TopicRecord['name']>();

    return {
      visitor: (node: UnistNode) => {
        if (is<TopicNode>(node, 'topic')) {
          topics.add(node.value);
        }
      },
      done: async () => {
        const newTopics = Array.from(topics);

        const existingTopics = await this.repo.topics.findTopicsOf(entity.entityId);
        const topicsToRemove = differenceWith(
          existingTopics,
          newTopics,
          ({ name: existingTopic }, newTopic) => existingTopic === newTopic,
        ).map(({ name }) => name);

        const topicsToCreate = differenceWith(
          newTopics,
          existingTopics,
          (existingTopic, { name: newTopic }) => newTopic === existingTopic,
        );

        const { entityId, updatedAt } = entity;
        await this.repo.topics.removeTopics(entityId, topicsToRemove);
        await this.repo.topics.createTopics(entityId, { names: topicsToCreate, createdAt: updatedAt });
      },
    };
  }

  private extractLinksAndMedias(entity: ContentUpdatedEvent) {
    let links: Link[] = [];

    return {
      visitor: (node: UnistNode) => {
        if (!(is<MdAstLinkNode>(node, 'link') || is<MdAstImageNode>(node, 'image')) || !node.url) {
          return;
        }

        const parsed = parseUrl(node.url);

        if (!parsed) {
          return;
        }

        links.push({
          sourceId: entity.entityId,
          targetId: parsed.entityId,
        });
      },
      done: async () => {
        links = uniqBy(links, 'targetId');
        const availableTargets = await this.repo.entities.findAllAvailable(links.map(({ targetId }) => targetId));
        const validLinks = intersectionWith(links, availableTargets, ({ targetId }, { id }) => targetId === id);

        await this.repo.links.removeLinks(entity.entityId);
        await this.repo.links.createLinks(validLinks);
      },
    };
  }

  public async queryAllTopics(): Promise<TopicVO[]> {
    const allTopics = groupBy(await this.repo.topics.findAllAvailableTopics(), 'name');
    const entityIds = Object.values(allTopics).flatMap((topics) => topics.map(({ entityId }) => entityId));
    const titles = await this.entityService.getNormalizedTitles(entityIds);

    return Object.keys(allTopics).map((name) => {
      const topics = allTopics[name];
      assert(topics);

      const entities = topics.map(({ entityId, entityType }) => ({ entityId, entityType, title: titles[entityId]! }));
      const activeAt = Math.max(...topics.map(({ createdAt }) => createdAt));

      return { entities, activeAt, name };
    });
  }

  public async queryEntityLinks(id: EntityId): Promise<{
    sources: LinkSourceVO[]; // link to this entity
    targets: LinkTargetVO[]; // link from this entity
  }> {
    await this.entityService.assertAvailableIds([id]);

    const links = await this.repo.links.findAvailableLinksOf(id);
    const sources = links.filter(({ targetId }) => targetId === id);
    const sourceIds = sources.map(({ sourceId }) => sourceId);
    const targets = links.filter(({ sourceId }) => sourceId === id);

    const titles = await this.entityService.getNormalizedTitles([
      ...sourceIds,
      ...targets.map(({ targetId }) => targetId),
    ]);

    const sourceEntities = await this.querySourceEntities(sourceIds);

    return {
      sources: sources.map(({ sourceId, sourceType }) => {
        return {
          entityId: sourceId,
          entityType: sourceType,
          title: titles[sourceId]!,
          sources: sourceEntities[sourceId]!,
        };
      }),
      targets: targets.map(({ targetId, targetType }) => {
        return {
          entityId: targetId,
          entityType: targetType,
          title: titles[targetId]!,
        };
      }),
    };
  }

  private async querySourceEntities(sourceIds: EntityId[]) {
    const contents = this.repo.entities.findAllContents(sourceIds);
    const result: Record<EntityId, Source[]> = {};

    for await (const { id, content } of contents) {
      const mdAst = ContentService.parseMarkdown(content);
      const sources: Source[] = [];

      visit(mdAst, (node) => {
        if (!is<MdAstLinkNode>(node, 'link')) {
          return;
        }

        const start = node.position?.start.offset;
        const end = node.position?.end.offset;

        if (typeof start !== 'number' || typeof end !== 'number') {
          return;
        }

        const parsed = parseUrl(node.url);

        if (!parsed) {
          return;
        }

        const snippet = content.slice(Math.max(0, start - 20), Math.min(content.length, end + 20));

        sources.push({
          targetFragmentId: parsed.fragmentId,
          snippet,
          highlightStart: 20,
          highlightEnd: 20 + (end - start),
        });
      });

      result[id] = sources;
    }

    return result;
  }
}
