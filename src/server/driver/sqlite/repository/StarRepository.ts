import type { EntityLocator } from '@domain/model/entity.js';
import type { StarVO, StarEntityLocator } from '@domain/model/star.js';
import type { StarRepository } from '@domain/service/repository/StarRepository.js';

import BaseRepository from './BaseRepository.js';
import schema from '../schema/star.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  readonly tableName = schema.tableName;

  async createOne(entity: StarEntityLocator) {
    const row = await super.createOneOn(this.tableName, { ...entity, id: this.generateId() });
    return row;
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
