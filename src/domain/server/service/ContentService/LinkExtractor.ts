import { uniqBy } from 'lodash-es';
import { is } from 'unist-util-is';
import assert from 'node:assert';
import type { Link as MdAstLinkNode, Image as MdAstImageNode, Node as UnistNode } from 'mdast';

import { type LinkRecord, LinkTargetType } from '@domain/server/model/content.js';
import Extractor from './Extractor.js';
import { parseAppUrl } from '@domain/shared/infra/markdown/url.js';

export default class LinkExtractor extends Extractor {
  private readonly links: LinkRecord[] = [];
  public visit(node: UnistNode) {
    // image syntax is used as multi-media syntax in our app
    if (!(is(node, 'link') || is(node, 'image'))) {
      return;
    }

    const start = node.position?.start.offset;
    const end = node.position?.end.offset;

    assert(typeof start === 'number' && typeof end === 'number', 'invalid source location');

    const { url } = node as MdAstImageNode | MdAstLinkNode;
    const appUrl = parseAppUrl(url);

    this.links.push({
      sourceId: this.entityId,
      sourceLocation: { start, end },
      target: appUrl ? appUrl.id : url,
      targetFragmentId: appUrl?.hash ?? null,
      targetType: appUrl
        ? appUrl.type === 'files'
          ? LinkTargetType.File
          : LinkTargetType.Entity
        : LinkTargetType.External,
    });
  }
  public async done() {
    const newLinks = uniqBy(this.links, (link) => `${link.target}-${link.targetFragmentId}`);

    await this.repo.contents.removeLinksOf(this.entityId, 'source');
    await this.repo.contents.createLinks(newLinks);
  }
}
