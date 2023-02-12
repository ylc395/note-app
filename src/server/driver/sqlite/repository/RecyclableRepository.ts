import type { EntityTypes } from 'interface/Entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclableSchema';

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const recyclablesRows: Row[] = await this.knex<Row>(this.schema.tableName)
      .insert(rows)
      .returning(this.knex.raw('*'));

    return recyclablesRows.map((row) => ({ deletedAt: row.deletedAt, id: String(row.entityId), type: row.entityType }));
  }
}
