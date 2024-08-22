import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import { is } from 'unist-util-is';
import { container, singleton } from 'tsyringe';
import type { Link as MdAstLinkNode, Image as MdAstImageNode, Node as UnistNode } from 'mdast';
import { groupBy, uniq, uniqBy } from 'lodash-es';
import assert from 'assert';

import { buildIndex } from '@utils/collection.js';
import { parseAppUrl, parseHash } from '@domain/shared/infra/markdown/url.js';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from '@domain/shared/infra/markdown/syntax/topic.js';
import {
  EventNames,
  LinkTargetType,
  type ContentUpdatedEvent,
  type TopicRecord,
  type LinkRecord,
  type TopicVO,
  type Snippet,
  type LinkVO,
  type ExternalLinkVO,
} from '@domain/server/model/content.js';
import type { EntityId } from '@domain/shared/model/entity.js';

import BaseService from './BaseService.js';
import EntityService from './EntityService.js';

@singleton()
export default class ContentService extends BaseService {
  constructor() {
    super();
    this.eventBus.on(EventNames.ContentUpdated, this.extract.bind(this));
  }

  private readonly entityService = container.resolve(EntityService);

  private async extract(entity: ContentUpdatedEvent) {
    if (typeof entity.body === 'undefined') {
      return;
    }

    const mdAst = ContentService.parseMarkdown(entity.body);
    const tasks = [this.extractLinksAndMedias, this.extractTopics].map((cb) => cb.call(this, entity));

    visit(mdAst, (node) => tasks.forEach(({ visit }) => visit(node)));

    for (const { done } of tasks) {
      await done();
    }
  }

  private extractTopics({ entityId, updatedAt }: ContentUpdatedEvent) {
    const topics: Array<Pick<TopicRecord, 'name' | 'locationStart' | 'locationEnd'>> = [];

    return {
      visit: (node: UnistNode) => {
        if (!is(node, 'topic')) {
          return;
        }

        const locationStart = node.position?.start.offset;
        const locationEnd = node.position?.end.offset;

        assert(typeof locationStart === 'number' && typeof locationEnd === 'number', 'invalid location');

        topics.push({
          name: (node as TopicNode).value,
          locationStart,
          locationEnd,
        });
      },
      done: async () => {
        const topicsToCreate = topics.map((topic) => ({
          ...topic,
          entityId,
          createdAt: updatedAt,
        }));

        return this.transaction(async () => {
          await this.repo.contents.removeTopicsOf(entityId);
          await this.repo.contents.createTopics(topicsToCreate);
        });
      },
    };
  }

  private extractLinksAndMedias(entity: ContentUpdatedEvent) {
    const links: LinkRecord[] = [];

    return {
      visit: (node: UnistNode) => {
        // image syntax is used as multi-media syntax in our app
        if (!(is(node, 'link') || is(node, 'image'))) {
          return;
        }

        const sourceLocationStart = node.position?.start.offset;
        const sourceLocationEnd = node.position?.end.offset;

        assert(
          typeof sourceLocationStart === 'number' && typeof sourceLocationEnd === 'number',
          'invalid source location',
        );

        const { url } = node as MdAstImageNode | MdAstLinkNode;
        const appUrl = parseAppUrl(url);

        const targetType = appUrl
          ? appUrl.type === 'files'
            ? LinkTargetType.File
            : LinkTargetType.Entity
          : LinkTargetType.External;

        links.push({
          sourceId: entity.entityId,
          sourceLocationStart,
          sourceLocationEnd,
          targetId: appUrl?.id ?? url, // we don't check whether id/url is valid when writing. Do it when reading
          targetSelector: appUrl?.hash ? parseHash(appUrl.hash) : undefined,
          targetType: targetType,
        });
      },
      done: async () => {
        const newLinks = uniqBy(links, (link) => `${link.targetId}-${link.targetSelector}`);

        return this.transaction(async () => {
          await this.repo.contents.removeLinksOf(entity.entityId, 'source');
          await this.repo.contents.createLinks(newLinks);
        });
      },
    };
  }

  public async queryAllTopics() {
    const topicRecords = await this.repo.contents.findAllTopics({ isAvailableOnly: true });
    const allTopicsMap = groupBy(topicRecords, ({ name }) => name);

    const entityIds = uniq(topicRecords.map(({ entityId }) => entityId));
    const entities = await this.entityService.getEntities(entityIds);

    const snippets = await this.getSnippets(
      topicRecords.map((record) => ({
        entityId: record.entityId,
        start: record.locationStart,
        end: record.locationEnd,
      })),
    );

    const topicVOs: TopicVO[] = Object.entries(allTopicsMap).map(([name, topicRecords]) => {
      const topicGroupedByEntity = groupBy(topicRecords, ({ entityId }) => entityId);
      const sourceEntities: TopicVO['entities'] = Object.entries(topicGroupedByEntity).map(([entityId, records]) => ({
        entity: entities[entityId]!,
        sources: records.map((record) => ({
          location: { start: record.locationStart, end: record.locationEnd },
          snippet: snippets[entityId]![`${record.locationStart},${record.locationEnd}`]!,
        })),
      }));

      return { entities: sourceEntities, name };
    });

    return topicVOs;
  }

  private async getSnippets(locations: Array<{ entityId: EntityId; start: number; end: number }>) {
    const locationGroups = groupBy(locations, ({ entityId }) => entityId);
    const entityIds = Object.keys(locationGroups);
    const contents = await this.repo.entities.findAllContents(entityIds);
    const result: Record<string, Record<string, Snippet>> = {};

    for await (const { body, id } of contents) {
      const locations: Record<string, Snippet> = {};

      for (const { start, end } of locationGroups[id]!) {
        locations[`${start},${end}`] = {
          text: body.slice(start, end),
          highlightStart: 0,
          highlightEnd: 0,
        };
      }

      result[id] = locations;
    }

    return result;
  }

  public async queryEntityLinks(id: EntityId): Promise<{
    sources: LinkVO[]; // link to this entity
    targets: Array<LinkVO | ExternalLinkVO>; // link from this entity
  }> {
    await this.entityService.assertAvailableIds([id]);

    const links = await this.repo.contents.findLinksOf(id, {
      isAvailableOnly: true,
      types: [LinkTargetType.Entity, LinkTargetType.External],
    });

    const entityLinks = links.filter(({ targetType }) => targetType === LinkTargetType.Entity);

    const sourceLinks = groupBy(
      entityLinks.filter(({ targetId }) => targetId === id),
      'sourceId',
    );
    const targetLinks = groupBy(
      entityLinks.filter(({ sourceId }) => sourceId === id),
      'targetId',
    );

    const entityIds = uniq(entityLinks.flatMap(({ sourceId, targetId }) => [sourceId, targetId]));
    const entities = buildIndex(await this.repo.entities.findAll(entityIds, { isAvailableOnly: true }));
    const snippets = await this.getSnippets(
      entityLinks.map(({ sourceId, sourceLocationEnd, sourceLocationStart }) => ({
        entityId: sourceId,
        start: sourceLocationStart,
        end: sourceLocationEnd,
      })),
    );

    const toLinkVOs = (links: Record<string, LinkRecord[]>) =>
      Object.entries(links).map(([sourceId, links]) => ({
        entity: entities[sourceId]!,
        links: links.map(({ targetSelector, sourceLocationEnd: end, sourceLocationStart: start }) => ({
          targetSelector: targetSelector || undefined,
          sourceLocation: { start, end },
          sourceSnippet: snippets[sourceId]![`${start},${end}`]!,
        })),
      }));

    return {
      sources: toLinkVOs(sourceLinks),
      targets: toLinkVOs(targetLinks),
    };
  }

  private static parseMarkdown(content: string) {
    return fromMarkdown(content, {
      mdastExtensions: [topicExtension],
      extensions: [topicTokenExtension],
    });
  }
}
