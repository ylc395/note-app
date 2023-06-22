import differenceWith from 'lodash/differenceWith';
import isEqual from 'lodash/isEqual';

import type { EntityLocator, EntityTypes } from 'interface/entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclable';

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  async put(entityType: EntityTypes, ids: string[]) {
    const newRows = ids.map((entityId) => ({ entityId, entityType }));
    const rows = await this.db
      .selectFrom(this.schema.tableName)
      .where('entityId', 'in', ids)
      .where('entityType', '=', entityType)
      .select(['entityId', 'entityType'])
      .execute();

    const recyclablesRows = await this._batchCreate(differenceWith(newRows, rows, isEqual));
    return recyclablesRows.map((row) => ({ ...row, entityId: String(row.entityId) }));
  }

  async findOneByLocator({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(this.schema.tableName)
      .select(['entityId', 'entityType', 'deletedAt'])
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .where('isHard', '=', 0)
      .executeTakeFirst();

    return row || null;
  }

  async findAllByLocator(type: EntityTypes, ids: EntityLocator['id'][]) {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.db
      .selectFrom(this.schema.tableName)
      .select(['entityId', 'entityType', 'deletedAt'])
      .where('entityId', 'in', ids)
      .where('entityType', '=', type)
      .execute();

    return rows;
  }

  async getHardDeletedRecord({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(this.schema.tableName)
      .selectAll()
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .where('isHard', '=', 0)
      .executeTakeFirst();

    return row ? { id: row.entityId, type: row.entityType, deletedAt: row.deletedAt } : null;
  }
}
