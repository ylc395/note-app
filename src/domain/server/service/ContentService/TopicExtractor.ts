import assert from 'node:assert';
import type { Node as UnistNode } from 'mdast';
import { is } from 'unist-util-is';

import type { Topic as TopicNode } from '#domain/shared/infra/markdown/syntax/topic.js';
import type { TopicRecord } from '#domain/server/model/content.js';
import Extractor from './Extractor.js';

export default class TopicExtractor extends Extractor {
  private readonly topics: TopicRecord[] = [];
  public visit(node: UnistNode) {
    if (!is(node, 'topic')) {
      return;
    }

    const start = node.position?.start.offset;
    const end = node.position?.end.offset;

    assert(typeof start === 'number' && typeof end === 'number', 'invalid location');

    this.topics.push({
      name: (node as TopicNode).value,
      location: { start, end },
      entityId: this.entityId,
    });
  }

  public async done() {
    await this.repo.contents.removeTopicsOf(this.entityId);
    await this.repo.contents.createTopics(this.topics);
  }
}
