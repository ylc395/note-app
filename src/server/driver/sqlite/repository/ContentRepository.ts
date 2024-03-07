import type { Link, LinkDirection, LinkToQuery, Topic } from '@domain/model/content.js';
import type { EntityId } from '@domain/model/entity.js';
import type { ContentRepository } from '@domain/service/repository/ContentRepository.js';

import BaseRepository from './BaseRepository.js';
import { type Row as LinkRow, tableName as linkTableName } from '../schema/link.js';
import { type Row as TopicRow, tableName as topicTableName } from '../schema/topic.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  async createLinks(links: Link[]) {
    await this.batchCreateOn(
      linkTableName,
      links.map(({ from, to, createdAt }) => ({
        fromEntityId: from.entityId,
        fromPosition: `${from.position.start},${from.position.end}` satisfies LinkRow['fromPosition'],
        toEntityId: to.entityId,
        toFragmentId: to.fragmentId,
        createdAt,
      })),
    );
  }

  async removeLinks(entityId: EntityId, direction?: LinkDirection) {
    await this.db
      .deleteFrom(linkTableName)
      .where((eb) =>
        direction
          ? eb(direction === 'to' ? 'toEntityId' : 'fromEntityId', '=', entityId)
          : eb.or([eb('toEntityId', '=', entityId), eb('fromEntityId', '=', entityId)]),
      )
      .execute();
  }

  async findAllLinkTos(q: LinkToQuery) {
    const rows = await this.db
      .selectFrom(linkTableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${linkTableName}.toEntityId`)
      .selectAll(linkTableName)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .where('toEntityId', '=', q.entityId)
      .execute();

    return rows.map((row) => {
      const [start, end] = row.fromPosition.split(',');

      return {
        createdAt: row.createdAt,
        from: {
          entityId: row.fromEntityId,
          position: { start: Number(start), end: Number(end) },
        },
        to: { entityId: row.toEntityId, fragmentId: row.toFragmentId },
      };
    });
  }

  async createTopics(topics: Topic[]) {
    await this.batchCreateOn(
      topicTableName,
      topics.map((topic) => ({
        ...topic,
        position: `${topic.position.start},${topic.position.end}` as TopicRow['position'],
      })),
    );
  }

  async removeTopicsOf(entityId: EntityId) {
    await this.db.deleteFrom(topicTableName).where('entityId', '=', entityId).execute();
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
      const [start, end] = position.split(',');
      return { ...row, position: { start: Number(start), end: Number(end) } };
    });
  }
}
