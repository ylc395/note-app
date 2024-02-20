import type { EntityId } from '@domain/model/entity.js';
import type { StarRepository } from '@domain/service/repository/StarRepository.js';
import type { StarQuery } from '@domain/model/star.js';

import BaseRepository from './BaseRepository.js';
import schema from '../schema/star.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as entityTableName } from '../schema/entity.js';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  private readonly tableName = schema.tableName;

  public async createOne(entityId: EntityId) {
    await super.createOneOn(this.tableName, { entityId, isValid: 1, updatedAt: Date.now() });
  }

  public async findAll(q: StarQuery) {
    let sql = this.db
      .selectFrom(this.tableName)
      .innerJoin(entityTableName, `${this.tableName}.entityId`, `${entityTableName}.id`)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.entityId`)
      .select([`${this.tableName}.entityId`, 'icon', 'title', 'type as entityType'])
      .where('isValid', '=', 1);

    if (q.isAvailableOnly) {
      sql = sql.where(`${recyclableTableName}.entityId`, 'is', null);
    }

    if (q.entityId) {
      sql = sql.where(`${this.tableName}.entityId`, 'in', q.entityId);
    }

    return sql.execute();
  }

  public async removeOne(id: EntityId) {
    await this.db.updateTable(this.tableName).set({ isValid: 0 }).where('entityId', '=', id).executeTakeFirst();
  }
}
