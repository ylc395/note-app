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
      links.map(({ from, to, createdAt }) => ({
        fromEntityId: from.entityId,
        fromEntityType: from.entityType,
        fromFragmentPosition: `${from.pos.start},${from.pos.end}` satisfies LinkRow['fromFragmentPosition'],
        toEntityId: to.entityId,
        toEntityType: to.entityType,
        toFragmentId: to.fragmentId,
        createdAt,
      })),
    );
  }

  async removeLinks({ entityId: id, entityType: type }: EntityLocator, _type: 'from' | 'to') {
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
        entityId: topic.entityId,
        entityType: topic.entityType,
        name: topic.name,
        position: `${topic.pos.start},${topic.pos.end}` satisfies TopicRow['position'],
        createdAt: topic.createdAt,
      })),
    );
  }

  async removeTopics({ entityId: id, entityType: type }: EntityLocator) {
    await this.db.deleteFrom(topicSchema.tableName).where('entityId', '=', id).where('entityType', '=', type).execute();
  }

  async findAllTopicNames() {
    const rows = await this.db.selectFrom(topicSchema.tableName).select('name').distinct().execute();

    return rows.map((row) => row.name);
  }

  async findAllTopics() {
    const rows = await this.db.selectFrom(topicSchema.tableName).selectAll().execute();

    return rows.map(({ position, ...row }) => {
      const [start, end] = position.split(',');
      return { ...row, pos: { start: Number(start), end: Number(end) } };
    });
  }
}
