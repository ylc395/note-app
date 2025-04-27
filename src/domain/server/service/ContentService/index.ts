import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Root } from 'mdast';
import { EXIT, SKIP, visit } from 'unist-util-visit';
import { compact, memoize, minBy, size, uniq } from 'lodash-es';
import { is } from 'unist-util-is';
import { toString } from 'mdast-util-to-string';
import escapeStringRegexp from 'escape-string-regexp';
import { getFragmentDirectives, parseFragmentDirectives } from 'text-fragments-polyfill/text-fragment-utils';
import TTLCache from '@isaacs/ttlcache';

import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
} from '#domain/shared/infra/markdown/syntax/topic.js';
import container from '#utils/singletonContainer.js';
import type { Entity, EntityId } from '#domain/shared/model/entity.js';
import {
  type TopicVO,
  type Snippet,
  type TextLocation,
  type ExternalReference,
  type LinkVO,
  LinkTargetType,
  type TopicQuery,
} from '#domain/server/model/content.js';

import BaseService from '../BaseService.js';
import EntityService from '../EntityService.js';
import LinkExtractor from './LinkExtractor.js';
import TopicExtractor from './TopicExtractor.js';
import { arrayOf, type MaybeArray } from '#utils/collection.js';

export default class ContentService extends BaseService {
  private readonly entityService = container.resolve(EntityService);

  public async extract({ body, id }: Pick<Entity, 'id' | 'body'>) {
    if (typeof body !== 'string') {
      return;
    }

    const extractors = [new TopicExtractor(id), new LinkExtractor(id)];
    const mdAst = ContentService.parseMarkdown(body);

    try {
      visit(mdAst, (node) => extractors.forEach((extractor) => extractor.visit(node)));
      await this.transaction(async () => {
        for (const extractor of extractors) {
          await extractor.done();
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async queryAllTopics(params?: TopicQuery) {
    const topicRecords = await this.repo.contents.findAllTopics({
      isAvailableOnly: true,
      entityType: params?.type,
      level: params?.level,
    });
    const allTopicsMap = Object.groupBy(topicRecords, ({ name }) => name);

    const entityIds = uniq(topicRecords.map(({ entityId }) => entityId));
    const entities = await this.entityService.getEntities(entityIds);

    const topicVOs: TopicVO[] = Object.entries(allTopicsMap).map(([name, topicRecords]) => {
      const topicGroupedByEntity = Object.groupBy(topicRecords || [], ({ entityId }) => entityId);
      const level = minBy(topicRecords, ({ level }) => level)?.level ?? 1;

      const sourceEntities: TopicVO['entities'] = Object.entries(topicGroupedByEntity).map(([entityId, records]) => ({
        entity: entities[entityId]!,
        sources: records!.map((record) => record.location),
      }));

      return { entities: sourceEntities, name, level };
    });

    return topicVOs;
  }

  public async queryLinksOf(entityId: MaybeArray<EntityId>, params?: { direction: 'start' | 'end' }) {
    await this.entityService.assertAvailableIds(arrayOf(entityId));

    const links = await this.repo.contents.findAllLinks({
      isAvailableOnly: true,
      entityId,
      direction: params?.direction,
      targetTypes: [LinkTargetType.Entity, LinkTargetType.External],
    });

    const entityLinks = links.filter(({ targetType }) => targetType === LinkTargetType.Entity);

    const snippetsFromLocation = await this.getSnippetsByLocations(
      links.map(({ sourceLocation, sourceId }) => ({ entityId: sourceId, location: sourceLocation })),
    );

    const snippetsFromFragmentId = await this.getSnippetsByFragmentIds(
      entityLinks.map(({ target, targetFragmentId }) => ({
        entityId: target,
        fragmentId: targetFragmentId,
      })),
    );

    const externalLinks: ExternalReference[] = links
      .filter(({ targetType }) => targetType === LinkTargetType.External)
      .map(({ target, sourceLocation, sourceId }) => ({
        url: target,
        location: sourceLocation,
        icon: null,
        snippet: snippetsFromLocation[sourceId]![ContentService.hashLocation(sourceLocation)]!,
      }));

    const entityIds = uniq(entityLinks.flatMap(({ sourceId, target }) => [sourceId, target]));
    const entities = await this.entityService.getEntities(entityIds);

    const linkVOs: LinkVO[] = entityLinks.map(({ sourceId, sourceLocation, target, targetFragmentId }) => ({
      sourceEntity: entities[sourceId]!,
      sourceLocation,
      sourceSnippet: snippetsFromLocation[sourceId]![ContentService.hashLocation(sourceLocation)]!,
      targetEntity: entities[target]!,
      targetFragmentId,
      targetSnippet: targetFragmentId ? snippetsFromFragmentId[target]![targetFragmentId]! : null,
    }));

    return [...linkVOs, ...externalLinks];
  }

  private async getSnippetsByLocations(locations: Array<{ entityId: EntityId; location: TextLocation }>) {
    const locationGroups = Object.groupBy(locations, ({ entityId }) => entityId);
    const entityIds = Object.keys(locationGroups);
    const contents = await this.repo.entities.findAllContents(entityIds);
    const result: Record<EntityId, Record<string, Required<Snippet>>> = {};

    for await (const { body, id } of contents) {
      const locations: Record<string, Snippet> = {};
      const mdAst = ContentService.parseMarkdown(body);

      for (const { location } of locationGroups[id]!) {
        const snippet = this.getSnippetByLocation(mdAst, location);

        if (snippet) {
          locations[ContentService.hashLocation(location)] = snippet;
        }
      }

      result[id] = locations;
    }

    return result;
  }

  private getSnippetByLocation(root: Root, location: TextLocation): Snippet | null {
    const texts: string[] = [];
    let textLength = 0;
    let highlight: TextLocation | undefined;
    let clipStart = false;
    const maxTextLength = 50; // todo: 从用户配置中读取

    visit(root, 'text', (node) => {
      if (textLength >= maxTextLength) {
        if (highlight) {
          return EXIT;
        }

        clipStart = true;
        const removedText = texts.shift();
        textLength -= removedText?.length ?? 0;
      }

      if (!node.position) {
        return;
      }

      if (node.position.start.offset! > location.end && !highlight) {
        return EXIT;
      }

      const text = toString(node);

      if (node.position.start.offset! >= location.start && node.position.end.offset! <= location.end) {
        highlight = {
          start: textLength + 1,
          end: textLength + 1 + text.length,
        };
      }

      texts.push(text);
      textLength += text.length;
    });

    if (highlight) {
      let text = texts.join('');

      if (text.length > maxTextLength) {
        text = `${text.slice(0, maxTextLength)}...`;
      }

      if (clipStart) {
        text = `...${text}`;
      }

      highlight.end = Math.min(highlight.end, maxTextLength - 1);

      return {
        text,
        highlights: highlight ? [highlight] : [],
      };
    }

    return null;
  }

  private async getSnippetsByFragmentIds(fragmentIds: Array<{ entityId: EntityId; fragmentId: string | null }>) {
    const result: Record<EntityId, Record<string, Snippet>> = {};
    const groups = Object.groupBy(fragmentIds, ({ entityId }) => entityId);
    const entityIds = Object.keys(groups);
    const contents = await this.repo.entities.findAllContents(entityIds);

    for await (const { body, id } of contents) {
      const snippets: Record<string, Snippet> = {};

      for (const { fragmentId } of groups[id]!) {
        if (!fragmentId) {
          continue;
        }

        const { text } = getFragmentDirectives(`#${fragmentId}`);

        if (!text) {
          continue;
        }

        const directives = parseFragmentDirectives({ text });
        const mdast = ContentService.parseMarkdown(body);
        const blockNodeTypes = ['blockquote', 'code', 'heading', 'paragraph', 'definition'];
        let snippet: Snippet | undefined;

        for (const { suffix, prefix, textEnd, textStart } of directives.text) {
          const startRegexpStr = compact([
            prefix && escapeStringRegexp(prefix),
            escapeStringRegexp(textStart),
            suffix && !textEnd && escapeStringRegexp(suffix),
          ]).join('\\b.');

          const endRegexpStr = compact([
            textEnd && escapeStringRegexp(textEnd),
            suffix && escapeStringRegexp(suffix),
          ]).join('\\b');

          visit(mdast, (node) => {
            // prefix-、start、end 和 -suffix 各自只会与单个块级元素中的文本匹配
            if (!blockNodeTypes.some((type) => is(node, type))) {
              return;
            }

            const text = toString(node, { includeHtml: false, includeImageAlt: false });

            if (!snippet) {
              const startMatchResult = text.match(new RegExp(startRegexpStr));

              if (startMatchResult) {
                snippet = {
                  text: startMatchResult[0],
                  highlights: [],
                };
              }
            }

            if (snippet) {
              if (!textEnd) {
                return EXIT;
              }

              if (textEnd) {
                const endMatchResult = text.match(new RegExp(endRegexpStr));

                if (endMatchResult) {
                  snippet.text += endMatchResult[0];
                  snippet.highlights.push({ start: 0, end: 0 });
                  return EXIT;
                }
              }
            }

            return SKIP;
          });
        }

        if (snippet) {
          snippets[fragmentId] = snippet;
        }
      }

      if (size(snippets) > 0) {
        result[id] = snippets;
      }
    }

    return result;
  }

  private static readonly parseMarkdown = memoize((content: string) => {
    return fromMarkdown(content, {
      mdastExtensions: [topicExtension],
      extensions: [topicTokenExtension],
    });
  });

  private static hashLocation({ start, end }: TextLocation) {
    return `${start},${end}`;
  }

  public static markdownToPlain(md: string) {
    return toString(this.parseMarkdown(md));
  }

  static {
    this.parseMarkdown.cache = new TTLCache({ ttl: 5000 });
  }
}
