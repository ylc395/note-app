import { Subject, groupBy, map, debounceTime, mergeAll } from 'rxjs';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import type { UnistNode } from 'unist-util-visit/lib';
import type { Link as MdAstLinkNode } from 'mdast';
import intersectionWith from 'lodash/intersectionWith';

import { is, parseUrl } from 'infra/markdown/utils';
import {
  mdastExtension as topicExtension,
  tokenExtension as topicTokenExtension,
  type Topic as TopicNode,
} from 'infra/markdown/topic';
import type { ContentUpdate, Link, Topic } from 'model/content';
import { EntityTypes, type EntityLocator } from 'model/entity';

import BaseService from './BaseService';
import EntityService from './EntityService';

@Injectable()
export default class ContentService extends BaseService {
  readonly tasks$ = new Subject<ContentUpdate>();
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

  enableAutoExtract() {
    this.tasks$
      .pipe(
        groupBy((v) => v.type === EntityTypes.Note),
        map((grouped$) => (grouped$.key ? grouped$.pipe(debounceTime(10 * 1000)) : grouped$)),
        mergeAll(),
      )
      .subscribe(this.extract);
  }

  private extractTopics(entity: EntityLocator) {
    const topics: Topic[] = [];

    return {
      visitor: (node: UnistNode) => {
        if (!is<TopicNode>(node, 'topic') || !node.position) {
          return;
        }

        topics.push({
          ...entity,
          pos: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 },
          name: node.value,
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

    return {
      visitor: (node: UnistNode) => {
        if (!is<MdAstLinkNode>(node, 'link') || !node.position || !node.url) {
          return;
        }

        const parsed = parseUrl(node.url);

        if (parsed) {
          links.push({
            from: { ...entity, pos: { start: node.position.start.offset || 0, end: node.position.end.offset || 0 } },
            to: parsed,
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
          await this.repo.contents.createLinks(intersectionWith(links, targets, ({ to }, { id }) => to.id === id));
        });
      },
    };
  }

  private readonly extract = async ({ content, ...entity }: ContentUpdate) => {
    const mdAst = fromMarkdown(content, { mdastExtensions: [topicExtension], extensions: [topicTokenExtension] });
    const reducers = [this.extractLinks, this.extractTopics].map((cb) => cb.call(this, entity));

    visit(mdAst, (node) => reducers.forEach(({ visitor }) => visitor(node)));

    for (const { done } of reducers) {
      await done();
    }
  };

  async processContent(update: ContentUpdate) {
    this.tasks$.next(update);
  }
}
