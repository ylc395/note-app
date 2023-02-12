import type { EntityTypes } from 'model/Entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclableSchema';

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const recyclablesRows = await this.knex<Row>(this.schema.tableName).insert(rows).returning(this.knex.raw('*'));

    return { count: recyclablesRows.length, deletedAt: recyclablesRows[0]?.deletedAt || 0 };
  }
}
