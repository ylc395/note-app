import type { Link, LinkDirection, LinkToQuery, Topic } from 'model/content';
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
        fromPosition: `${from.position.start},${from.position.end}` satisfies LinkRow['fromPosition'],
        toEntityId: to.entityId,
        toEntityType: to.entityType,
        toFragmentId: to.fragmentId,
        createdAt,
      })),
    );
  }

  async removeLinks({ entityId: id, entityType: type }: EntityLocator, direction: LinkDirection) {
    await this.db
      .deleteFrom(linkSchema.tableName)
      .where((eb) =>
        eb.and(
          direction === 'to' ? { toEntityId: id, toEntityType: type } : { fromEntityId: id, fromEntityType: type },
        ),
      )
      .execute();
  }

  async findAllLinkTos(q: LinkToQuery) {
    const rows = await this.db
      .selectFrom(linkSchema.tableName)
      .selectAll()
      .where((eb) => eb.and({ toEntityId: q.entityId, toEntityType: q.entityType }))
      .execute();

    return rows.map((row) => {
      const [start, end] = row.fromPosition.split(',');

      return {
        createdAt: row.createdAt,
        from: {
          entityId: row.fromEntityId,
          entityType: row.fromEntityType,
          position: { start: Number(start), end: Number(end) },
        },
        to: { entityId: row.toEntityId, entityType: row.toEntityType, fragmentId: row.toFragmentId },
      };
    });
  }

  async createTopics(topics: Topic[]) {
    await this._batchCreate(
      topicSchema.tableName,
      topics.map((topic) => ({
        ...topic,
        position: `${topic.position.start},${topic.position.end}` satisfies TopicRow['position'],
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
      return { ...row, position: { start: Number(start), end: Number(end) } };
    });
  }
}
