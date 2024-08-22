import type { EntityId } from '@domain/shared/model/entity.js';
import type { ContentRepository } from '@domain/server/repository/ContentRepository.js';

import BaseRepository from './BaseRepository.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as topicTableName } from '../schema/topic.js';
import type { LinkRecord, LinkTargetType, TopicRecord } from '@domain/server/model/content.js';

export default class SqliteContentRepository extends BaseRepository implements ContentRepository {
  public async createTopics(topics: TopicRecord[]) {
    await this.db.insertInto(topicTableName).values(topics).execute();
  }

  public async removeTopicsOf(entityId: EntityId) {
    await this.db.deleteFrom(topicTableName).where('entityId', '=', entityId).execute();
  }

  public findAllTopics(config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(topicTableName)
      .select([
        `${topicTableName}.name`,
        `${topicTableName}.entityId`,
        `${topicTableName}.locationStart`,
        `${topicTableName}.locationEnd`,
        `${topicTableName}.createdAt`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql.leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${topicTableName}.entityId`);
    }

    return sql.execute();
  }

  public async createLinks(links: LinkRecord[]) {
    await this.db.insertInto(linkTableName).values(
      links.map(({ targetSelector, ...link }) => ({
        ...link,
        targetSelector: targetSelector && JSON.stringify(targetSelector),
      })),
    );
  }

  public async removeLinksOf(entityId: EntityId, as: 'source' | 'all') {
    await this.db
      .deleteFrom(linkTableName)
      .where((eb) => eb.or([eb('sourceId', '=', entityId), ...(as === 'all' ? [eb('targetId', '=', entityId)] : [])]))
      .execute();
  }

  public async findLinksOf(
    entityId: EntityId | EntityId[],
    config?: { isAvailableOnly?: boolean; types?: LinkTargetType[] },
  ) {
    const rows = await this.db
      .selectFrom(linkTableName)
      .leftJoin(
        `${recyclableTableName} as targetRecyclables`,
        `targetRecyclables.entityId`,
        `${linkTableName}.targetId`,
      )
      .leftJoin(
        `${recyclableTableName} as sourceRecyclables`,
        `sourceRecyclables.entityId`,
        `${linkTableName}.sourceId`,
      )
      .where((eb) =>
        eb.and([
          eb.or([
            eb(`${linkTableName}.targetId`, Array.isArray(entityId) ? 'in' : '=', entityId),
            eb(`${linkTableName}.sourceId`, Array.isArray(entityId) ? 'in' : '=', entityId),
          ]),
          ...(config?.isAvailableOnly
            ? [eb('targetRecyclables.entityId', 'is', null), eb('sourceRecyclables.entityId', 'is', null)]
            : []),
        ]),
      )
      .select([
        `${linkTableName}.sourceId`,
        `${linkTableName}.sourceLocationStart`,
        `${linkTableName}.sourceLocationEnd`,
        `${linkTableName}.targetId`,
        `${linkTableName}.targetType`,
        `${linkTableName}.targetSelector`,
      ])
      .execute();

    return rows.map(({ targetSelector, ...row }) => ({
      ...row,
      targetSelector: targetSelector && JSON.parse(targetSelector),
    }));
  }
}
