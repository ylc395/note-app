import type { EntityTypes } from 'interface/Entity';
import type { StarRepository } from 'service/repository/StarRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/starSchema';

export default class SqliteStarRepository extends BaseRepository<Row> implements StarRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const recyclablesRows: Row[] = await this.knex<Row>(this.schema.tableName)
      .insert(rows)
      .returning(this.knex.raw('*'));

    return recyclablesRows.map((row) => ({ id: String(row.entityId), type: row.entityType }));
  }

  async findAll() {
    const recyclablesRows: Row[] = await this.knex<Row>(this.schema.tableName).select(this.knex.raw('*'));
    return recyclablesRows.map((row) => ({ id: String(row.entityId), type: row.entityType }));
  }
}
