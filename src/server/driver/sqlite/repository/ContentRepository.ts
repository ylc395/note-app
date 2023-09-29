import { isInlineTopic, type Link, type LinkDirection, type LinkToQuery, type Topic } from 'model/content';
import type { EntityLocator } from 'model/entity';
import type { ContentRepository } from 'service/repository/ContentRepository';

import BaseRepository from './BaseRepository';
import { type Row as LinkRow, tableName as linkTableName } from '../schema/link';
import { type Row as TopicRow, tableName as topicTableName } from '../schema/topic';
import { tableName as recyclableTableName } from '../schema/recyclable';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  async createLinks(links: Link[]) {
    await this._batchCreate(
      linkTableName,
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

  async removeLinks({ entityId: id, entityType: type }: EntityLocator, direction?: LinkDirection) {
    await this.db
      .deleteFrom(linkTableName)
      .where((eb) =>
        direction
          ? eb.and(
              direction === 'to' ? { toEntityId: id, toEntityType: type } : { fromEntityId: id, fromEntityType: type },
            )
          : eb.or([eb.and({ toEntityId: id, toEntityType: type }), eb.and({ fromEntityId: id, fromEntityType: type })]),
      )
      .execute();
  }

  async findAllLinkTos(q: LinkToQuery) {
    const rows = await this.db
      .selectFrom(linkTableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${linkTableName}.toEntityId`)
      .selectAll(linkTableName)
      .where(`${recyclableTableName}.entityId`, 'is', null)
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
      topicTableName,
      topics.map((topic) => ({
        ...topic,
        position: (isInlineTopic(topic)
          ? `${topic.position.start},${topic.position.end}`
          : null) as TopicRow['position'],
      })),
    );
  }

  async removeTopics({ entityId: id, entityType: type }: EntityLocator, inlineOnly: boolean) {
    let qb = this.db.deleteFrom(topicTableName).where('entityId', '=', id).where('entityType', '=', type);

    if (inlineOnly) {
      qb = qb.where('position', 'is', null);
    }

    await qb.execute();
  }

  async findAvailableTopicNames() {
    const rows = await this.db
      .selectFrom(topicTableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .select('name')
      .distinct()
      .execute();

    return rows.map((row) => row.name);
  }

  async findAvailableTopics() {
    const rows = await this.db
      .selectFrom(topicTableName)

      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .selectAll(topicTableName)
      .execute();

    return rows.map(({ position, ...row }) => {
      if (position) {
        const [start, end] = position.split(',');
        return { ...row, position: { start: Number(start), end: Number(end) } };
      }

      return row;
    });
  }
}
