import type { Link, Topic } from 'model/content';
import type { EntityLocator } from 'model/entity';
import type { ContentRepository } from 'service/repository/ContentRepository';

import BaseRepository from './BaseRepository';
import linkSchema, { type Row as LinkRow } from '../schema/link';
import topicSchema, { type Row as TopicRow } from '../schema/topic';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  async createLinks(links: Link[]) {
    await this._batchCreate(
      linkSchema.tableName,
      links.map(({ from, to }) => ({
        fromEntityId: from.id,
        fromEntityType: from.type,
        fromFragmentPosition: `${from.pos.start},${from.pos.end}` satisfies LinkRow['fromFragmentPosition'],
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
        position: `${topic.pos.start},${topic.pos.end}` satisfies TopicRow['position'],
      })),
    );
  }

  async removeTopics({ id, type }: EntityLocator) {
    await this.db.deleteFrom(topicSchema.tableName).where('entityId', '=', id).where('entityType', '=', type).execute();
  }
}
