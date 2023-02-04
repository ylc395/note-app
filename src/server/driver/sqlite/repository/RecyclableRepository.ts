import { RecyclablesTypes } from 'service/RecyclableService';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/recyclableSchema';
import noteSchema from '../schema/noteSchema';

const RECYCLABLES_TYPE_TABLE = {
  [RecyclablesTypes.Note]: noteSchema.tableName,
} as const;

export default class SqliteRecyclableRepository extends BaseRepository<Row> implements RecyclablesRepository {
  protected readonly schema = schema;

  private getEntityTable(type: RecyclablesTypes) {
    return RECYCLABLES_TYPE_TABLE[type];
  }

  async put(type: RecyclablesTypes, ids: string[]) {
    const rows = ids.map((id) => ({ entityId: Number(id), entityType: type }));
    const recyclablesRows = await this.knex<Row>(this.schema.tableName).insert(rows).returning(this.knex.raw('*'));

    return { count: recyclablesRows.length, deletedAt: recyclablesRows[0]?.deletedAt };
  }
}
