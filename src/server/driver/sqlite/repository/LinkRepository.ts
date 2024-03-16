import type { EntityId } from '@domain/model/entity.js';
import type { LinkRepository } from '@domain/service/repository/LinkRepository.js';
import type { Link } from '@domain/model/content.js';

import BaseRepository from './BaseRepository.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as entityTableName } from '../schema/entity.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteContentRepository extends BaseRepository implements LinkRepository {
  public async createLinks(links: Link[]) {
    await this.batchCreateOn(linkTableName, links);
  }

  public async removeLinks(sourceId: EntityId) {
    await this.db.deleteFrom(linkTableName).where('sourceId', '=', sourceId).execute();
  }

  public async findAvailableLinksOf(entityId: EntityId): Promise<Required<Link>[]> {
    const rows = await this.db
      .selectFrom(linkTableName)
      .innerJoin(`${entityTableName} as targetEntities`, 'targetEntities.id', `${linkTableName}.targetId`)
      .innerJoin(`${entityTableName} as sourceEntities`, 'sourceEntities.id', `${linkTableName}.sourceId`)
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
          eb.or([eb(`${linkTableName}.targetId`, '=', entityId), eb(`${linkTableName}.sourceId`, '=', entityId)]),
          eb('targetRecyclables.entityId', 'is', null),
          eb('sourceRecyclables.entityId', 'is', null),
        ]),
      )
      .selectAll(linkTableName)
      .select(['targetEntities.type as targetType', 'sourceEntities.type as sourceType'])
      .execute();

    return rows;
  }
}
