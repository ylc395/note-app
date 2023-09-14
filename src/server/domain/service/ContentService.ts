import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import type { UnistNode } from 'unist-util-visit/lib';
import type { Link as MdAstLinkNode } from 'mdast';
import intersectionWith from 'lodash/intersectionWith';

import { is, parseUrl } from 'infra/markdown/utils';
import type { ContentUpdate, Link } from 'model/content';
import type { EntityLocator } from 'model/entity';

import BaseService from './BaseService';
import RevisionService from './RevisionService';
import EntityService from './EntityService';

@Injectable()
export default class ContentService extends BaseService {
  @Inject() private revisionService!: RevisionService;
  @Inject(forwardRef(() => EntityService)) private readonly entityService!: EntityService;

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
            from: { ...entity, pos: `${node.position.start.offset || 0},${node.position.end.offset || 0}` },
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
          await this.contents.removeLinks(entity, 'from');
          await this.contents.createLinks(intersectionWith(links, targets, ({ to }, { id }) => to.id === id));
        });
      },
    };
  }

  async processContent({ content, ...entity }: ContentUpdate) {
    const mdAst = fromMarkdown(content);
    const reducers = [this.extractLinks].map((cb) => cb.call(this, entity));
    const visitors = reducers.map(({ visitor }) => visitor);
    const doneCbs = reducers.map(({ done }) => done);

    visit(mdAst, (node) => visitors.forEach((visitor) => visitor(node)));

    for (const done of doneCbs) {
      await done();
    }

    await this.revisionService.createRevision({ content, ...entity });
  }
}
