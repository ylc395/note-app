import map from 'lodash/map';

import type { EntityLocator } from 'model/entity';
import type { StarRecord } from 'model/star';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/star';
import { tableName as recyclableTableName } from '../schema/recyclable';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  readonly tableName = schema.tableName;
  async batchCreate(entities: EntityLocator[]) {
    const rows = entities.map(({ entityId, entityType }) => ({
      entityId,
      entityType,
      id: this.generateId(),
    }));
    const starRows = await this._batchCreate(this.tableName, rows);

    return starRows;
  }

  async findOneById(id: StarRecord['id']) {
    return (await this.db.selectFrom(this.tableName).selectAll().where('id', '=', id).executeTakeFirst()) || null;
  }

  async findAllByLocators(entities?: EntityLocator[], filter?: { isAvailable?: boolean }) {
    let qb = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (typeof filter?.isAvailable === 'boolean') {
      qb = qb
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.entityId`)
        .where(`${recyclableTableName}.entityId`, filter.isAvailable ? 'is' : 'is not', null);
    }

    if (entities) {
      qb = qb.where(`${this.tableName}.entityId`, 'in', map(entities, 'id'));
    }

    return await qb.execute();
  }

  async remove(id: StarRecord['id']) {
    await this.db.deleteFrom(this.tableName).where('id', '=', id).execute();
  }
}
