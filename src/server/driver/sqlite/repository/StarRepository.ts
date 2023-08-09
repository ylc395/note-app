import type { EntityLocator } from 'model/entity';
import type { StarRecord } from 'model/star';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/star';

const { tableName } = schema;

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  async batchCreate(entities: EntityLocator[]) {
    const rows = entities.map(({ id, type }) => ({ entityId: id, entityType: type, id: this.generateId() }));
    const starRows = await this._batchCreate(tableName, rows);

    return starRows;
  }

  async findOneById(id: StarRecord['id']) {
    return (await this.db.selectFrom(tableName).selectAll().where('id', '=', id).executeTakeFirst()) || null;
  }

  async findAllByLocators(entities?: EntityLocator[]) {
    let qb = this.db.selectFrom(tableName);

    if (entities) {
      const ids = entities.map(({ id }) => id);
      qb = qb.where('entityId', 'in', ids);
    }

    return await qb.selectAll().execute();
  }

  async remove(id: StarRecord['id']) {
    await this.db.deleteFrom(tableName).where('id', '=', id).execute();
  }
}
