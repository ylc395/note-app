import type { EntityId } from '@domain/shared/model/entity.js';
import type { StarRepository, StarQuery } from '@domain/server/repository/starRepository.js';
import type { Star } from '@domain/shared/model/star.js';

import BaseRepository from './BaseRepository.js';
import schema from '../schema/star.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  private readonly tableName = schema.tableName;

  public async createOne(star: Star) {
    await this.db.insertInto(this.tableName).values(star);
  }

  public async findAll(q?: StarQuery) {
    let sql = this.db.selectFrom(this.tableName).select([`${this.tableName}.entityId`, `${this.tableName}.createdAt`]);

    if (q?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.entityId`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (q?.entityIds) {
      sql = sql.where(`${this.tableName}.entityId`, 'in', q.entityIds);
    }

    return sql.execute();
  }

  public async removeOne(id: EntityId) {
    await this.db.deleteFrom(this.tableName).where('entityId', '=', id).execute();
  }

  public async findOneByEntityId(entityId: EntityId) {
    const row = await this.db
      .selectFrom(this.tableName)
      .select(['entityId', 'createdAt'])
      .where('entityId', '=', entityId)
      .executeTakeFirst();

    return row || null;
  }
}
