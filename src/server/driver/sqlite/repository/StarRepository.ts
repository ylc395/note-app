import type { EntityLocator } from 'interface/entity';
import type { StarRecord } from 'interface/star';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/star';

export default class SqliteStarRepository extends BaseRepository implements StarRepository {
  protected readonly schema = schema;

  async create(entities: EntityLocator[]) {
    const rows = entities.map(({ id, type }) => ({ entityId: id, entityType: type, id: this.generateId() }));
    const starRows = await this.batchCreate(this.schema.tableName, rows);

    return starRows;
  }

  async findOneById(id: StarRecord['id']) {
    return (
      (await this.db.selectFrom(this.schema.tableName).selectAll().where('id', '=', id).executeTakeFirst()) || null
    );
  }

  async findAllByLocators(entities?: EntityLocator[]) {
    let qb = this.db.selectFrom(this.schema.tableName);

    if (entities) {
      const ids = entities.map(({ id }) => id);
      qb = qb.where('entityId', 'in', ids);
    }

    return await qb.selectAll().execute();
  }

  async remove(id: StarRecord['id']) {
    await this.db.deleteFrom(this.schema.tableName).where('id', '=', id).execute();
  }
}
