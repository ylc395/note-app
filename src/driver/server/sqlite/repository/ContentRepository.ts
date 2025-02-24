import type { EntityId } from '#domain/shared/model/entity.js';
import type { ContentRepository, LinkQuery, TopicQuery } from '#domain/server/repository/contentRepository.js';
import { compact } from 'lodash-es';

import BaseRepository from './BaseRepository.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as topicTableName } from '../schema/topic.js';
import { tableName as entityTableName } from '../schema/entity.js';
import type { LinkRecord, TopicRecord } from '#domain/server/model/content.js';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  public async createTopics(topics: TopicRecord[]) {
    if (topics.length === 0) {
      return;
    }

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
      .select([
        `${topicTableName}.name`,
        `${topicTableName}.entityId`,
        `${topicTableName}.location`,
        `${topicTableName}.level`,
      ]);

    if (config?.entityType) {
      sql = sql
        .innerJoin(entityTableName, `${topicTableName}.entityId`, `${entityTableName}.id`)
        .where(`${entityTableName}.type`, '=', config.entityType);
    }

    if (config?.level) {
      sql = sql.where(`${topicTableName}.level`, '=', config.level);
    }

    if (config?.isAvailableOnly) {
      sql = sql.leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`);
    }

    const rows = await sql.execute();

    return rows.map((row) => ({ ...row, location: JSON.parse(row.location) }));
  }

  public async createLinks(links: LinkRecord[]) {
    if (links.length === 0) {
      return;
    }

    await this.db
      .insertInto(linkTableName)
      .values(
        links.map(({ sourceLocation, ...link }) => ({
          ...link,
          sourceLocation: JSON.stringify(sourceLocation),
        })),
      )
      .execute();
  }

  public async removeLinksOf(entityId: EntityId, as: 'source' | 'all') {
    await this.db
      .deleteFrom(linkTableName)
      .where((eb) => eb.or([eb('sourceId', '=', entityId), ...(as === 'all' ? [eb('target', '=', entityId)] : [])]))
      .execute();
  }

  public async findAllLinks({ entityId, targetTypes, isAvailableOnly, direction, startEntityType }: LinkQuery) {
    let sql = this.db
      .selectFrom(linkTableName)

      .select([
        `${linkTableName}.sourceId`,
        `${linkTableName}.sourceLocation`,
        `${linkTableName}.target`,
        `${linkTableName}.targetType`,
        `${linkTableName}.targetDomain`,
        `${linkTableName}.targetFragmentId`,
      ]);

    if (targetTypes) {
      sql = sql.where(`${linkTableName}.targetType`, 'in', targetTypes);
    }

    if (entityId) {
      sql = sql.where(({ eb, or }) => {
        const idStatements = or(
          compact([
            direction !== 'start' && eb(`${linkTableName}.target`, Array.isArray(entityId) ? 'in' : '=', entityId),
            direction !== 'end' && eb(`${linkTableName}.sourceId`, Array.isArray(entityId) ? 'in' : '=', entityId),
          ]),
        );

        return idStatements;
      });
    }

    if (startEntityType) {
      sql = sql
        .innerJoin(entityTableName, `${entityTableName}.id`, `${linkTableName}.sourceId`)
        .where(`${entityTableName}.type`, '=', startEntityType);
    }

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

    return rows;
  }
}
