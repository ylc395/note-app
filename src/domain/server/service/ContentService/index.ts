import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import { container, singleton } from 'tsyringe';
import { uniq } from 'lodash-es';

import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
} from '@domain/shared/infra/markdown/syntax/topic.js';
import type { Entity, EntityId } from '@domain/shared/model/entity.js';
import { type TopicVO, type Snippet, type TextLocation } from '@domain/server/model/content.js';

import BaseService from '../BaseService.js';
import EntityService from '../EntityService.js';
import LinkExtractor from './LinkExtractor.js';
import TopicExtractor from './TopicExtractor.js';

@singleton()
export default class ContentService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  private extract({ body, id }: Pick<Entity, 'id' | 'body'>) {
    if (typeof body !== 'string') {
      return;
    }

    const extractors = [new TopicExtractor(id), new LinkExtractor(id)];
    const mdAst = ContentService.parseMarkdown(body);

    visit(mdAst, (node) => extractors.forEach((extractor) => extractor.visit(node)));

    return this.transaction(async () => {
      for (const extractor of extractors) {
        await extractor.done();
      }
    });
  }

  public async queryAllTopics() {
    const topicRecords = await this.repo.contents.findAllTopics({ isAvailableOnly: true });
    const allTopicsMap = Object.groupBy(topicRecords, ({ name }) => name);

    const entityIds = uniq(topicRecords.map(({ entityId }) => entityId));
    const entities = await this.entityService.getEntities(entityIds);
    const snippets = await this.getSnippetsByLocations(topicRecords);

    const topicVOs: TopicVO[] = Object.entries(allTopicsMap).map(([name, topicRecords]) => {
      const topicGroupedByEntity = Object.groupBy(topicRecords || [], ({ entityId }) => entityId);
      const sourceEntities: TopicVO['entities'] = Object.entries(topicGroupedByEntity).map(([entityId, records]) => ({
        entity: entities[entityId]!,
        sources: records!.map((record) => ({
          location: record.location,
          snippet: snippets[entityId]![`${record.location.start},${record.location.end}`]!,
        })),
      }));

      return { entities: sourceEntities, name };
    });

    return topicVOs;
  }

  private async getSnippetsByLocations(locations: Array<{ entityId: EntityId; location: TextLocation }>) {
    const locationGroups = Object.groupBy(locations, ({ entityId }) => entityId);
    const entityIds = Object.keys(locationGroups);
    const contents = await this.repo.entities.findAllContents(entityIds);
    const result: Record<string, Record<string, Snippet>> = {};

    for await (const { body, id } of contents) {
      const locations: Record<string, Snippet> = {};

      for (const { location } of locationGroups[id]!) {
        locations[`${location.start},${location.end}`] = {
          text: body.slice(location.start, location.end),
          highlight: {
            start: 0,
            end: 0,
          },
        };
      }

      result[id] = locations;
    }

    return result;
  }

  private static parseMarkdown(content: string) {
    return fromMarkdown(content, {
      mdastExtensions: [topicExtension],
      extensions: [topicTokenExtension],
    });
  }
}
