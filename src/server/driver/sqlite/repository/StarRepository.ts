import type { EntityLocator } from '@domain/model/entity';
import type { StarVO, StarEntityLocator } from '@domain/model/star';
import type { StarRepository } from '@domain/service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/star';
import { tableName as recyclableTableName } from '../schema/recyclable';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  readonly tableName = schema.tableName;
  async batchCreate(entities: StarEntityLocator[]) {
    const rows = entities.map(({ entityId, entityType }) => ({
      entityId,
      entityType,
      id: this.generateId(),
    }));
    const starRows = await this._batchCreate(this.tableName, rows);

    return starRows;
  }

  async findOneById(id: StarVO['id']) {
    return (await this.db.selectFrom(this.tableName).selectAll().where('id', '=', id).executeTakeFirst()) || null;
  }

  async findAllAvailable() {
    return await this.db
      .selectFrom(this.tableName)
      .selectAll(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.entityId`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .execute();
  }

  async findAllByEntityId(entityIds: EntityLocator['entityId'][]) {
    return await this.db
      .selectFrom(this.tableName)
      .selectAll(this.tableName)
      .where(`${this.tableName}.entityId`, 'in', entityIds)
      .execute();
  }

  async remove(id: StarVO['id']) {
    const { numDeletedRows } = await this.db.deleteFrom(this.tableName).where('id', '=', id).executeTakeFirst();

    return Number(numDeletedRows) === 1;
  }
}
