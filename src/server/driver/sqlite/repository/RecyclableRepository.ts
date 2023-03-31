import type { Knex } from 'knex';
import type { EntityTypes } from 'interface/entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclable';

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  async put(type: EntityTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const recyclablesRows: Row[] = await this.knex<Row>(this.schema.tableName)
      .insert(rows)
      .returning(this.knex.raw('*'));

    return recyclablesRows.map((row) => ({ ...row, entityId: String(row.entityId) }));
  }

  static withoutRecyclables(qb: Knex.QueryBuilder, joinTable: string, entityType: Knex.Raw<EntityTypes>) {
    const recyclableTable = schema.tableName;

    return qb
      .leftJoin(recyclableTable, function () {
        this.on(`${recyclableTable}.entityType`, '=', entityType);
        this.on(`${recyclableTable}.entityId`, `${joinTable}.id`);
      })
      .whereNull(`${recyclableTable}.entityId`);
  }
}
