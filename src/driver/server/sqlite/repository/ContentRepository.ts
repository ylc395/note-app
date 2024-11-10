import type { EntityId } from '@domain/shared/model/entity.js';
import type { ContentRepository, LinkQuery, TopicQuery } from '@domain/server/repository/contentRepository.js';

import BaseRepository from './BaseRepository.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as topicTableName } from '../schema/topic.js';
import type { LinkRecord, TopicRecord } from '@domain/server/model/content.js';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  public async createTopics(topics: TopicRecord[]) {
    await this.db
      .insertInto(topicTableName)
      .values(topics.map((topic) => ({ ...topic, location: JSON.stringify(topic.location) })))
      .execute();
  }

  public async removeTopicsOf(entityId: EntityId) {
    await this.db.deleteFrom(topicTableName).where('entityId', '=', entityId).execute();
  }

  public async findAllTopics(config?: TopicQuery) {
    let sql = this.db
      .selectFrom(topicTableName)
      .select([`${topicTableName}.name`, `${topicTableName}.entityId`, `${topicTableName}.location`]);

    if (config?.isAvailableOnly) {
      sql = sql.leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`);
    }

    const rows = await sql.execute();

    return rows.map((row) => ({ ...row, location: JSON.parse(row.location) }));
  }

  public async createLinks(links: LinkRecord[]) {
    await this.db.insertInto(linkTableName).values(
      links.map(({ sourceLocation, ...link }) => ({
        ...link,
        sourceLocation: JSON.stringify(sourceLocation),
      })),
    );
  }

  public async removeLinksOf(entityId: EntityId, as: 'source' | 'all') {
    await this.db
      .deleteFrom(linkTableName)
      .where((eb) => eb.or([eb('sourceId', '=', entityId), ...(as === 'all' ? [eb('target', '=', entityId)] : [])]))
      .execute();
  }

  public async findAllLinks({ entityId, types, isAvailableOnly }: LinkQuery) {
    let sql = this.db
      .selectFrom(linkTableName)
      .where(({ eb, or, and }) =>
        and([
          or([
            eb(`${linkTableName}.target`, Array.isArray(entityId) ? 'in' : '=', entityId),
            eb(`${linkTableName}.sourceId`, Array.isArray(entityId) ? 'in' : '=', entityId),
          ]),
          eb(`${linkTableName}.targetType`, 'in', types),
        ]),
      )
      .select([
        `${linkTableName}.sourceId`,
        `${linkTableName}.sourceLocation`,
        `${linkTableName}.target`,
        `${linkTableName}.targetType`,
        `${linkTableName}.targetFragmentId`,
      ]);

    if (isAvailableOnly) {
      sql = sql
        .leftJoin(
          `${recyclableTableName} as targetRecyclables`,
          `targetRecyclables.entityId`,
          `${linkTableName}.target`,
        )
        .leftJoin(
          `${recyclableTableName} as sourceRecyclables`,
          `sourceRecyclables.entityId`,
          `${linkTableName}.sourceId`,
        )
        .where(({ and, eb }) =>
          and([eb('targetRecyclables.entityId', 'is', null), eb('sourceRecyclables.entityId', 'is', null)]),
        );
    }

    const rows = await sql.execute();

    return rows.map(({ sourceLocation, ...row }) => ({
      ...row,
      sourceLocation: JSON.parse(sourceLocation),
    }));
  }
}
