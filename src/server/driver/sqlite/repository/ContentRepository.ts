import type { Link, Topic } from 'model/content';
import type { ContentRepository } from 'service/repository/ContentRepository';

import BaseRepository from './BaseRepository';
import linkSchema from '../schema/link';
import topicSchema from '../schema/topic';
import type { EntityLocator } from 'model/entity';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  async createLinks(links: Link[]) {
    await this._batchCreate(
      linkSchema.tableName,
      links.map(({ from, to }) => ({
        fromEntityId: from.id,
        fromEntityType: from.type,
        fromFragmentId: from.pos,
        toEntityId: to.id,
        toEntityType: to.type,
        toFragmentId: to.fragmentId,
      })),
    );
  }

  async removeLinks({ id, type }: EntityLocator, _type: 'from' | 'to') {
    await this.db
      .deleteFrom(linkSchema.tableName)
      .where((eb) =>
        eb.and(_type === 'to' ? { toEntityId: id, toEntityType: type } : { fromEntityId: id, fromEntityType: type }),
      )
      .execute();
  }

  async createTopics(topics: Topic[]) {
    await this._batchCreate(
      topicSchema.tableName,
      topics.map((topic) => ({
        entityId: topic.id,
        entityType: topic.type,
        name: topic.name,
        position: topic.pos,
      })),
    );
  }

  async removeTopics({ id, type }: EntityLocator) {
    await this.db.deleteFrom(topicSchema.tableName).where('entityId', '=', id).where('entityType', '=', type).execute();
  }
}
