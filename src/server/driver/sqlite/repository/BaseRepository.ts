import pick from 'lodash/pick';
import omit from 'lodash/omit';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';
import type { Database as Sqlite3 } from 'sqlite3';

import type { Schema } from '../schema/type';
import type { Knex } from 'knex';

export default abstract class BaseRepository<Row extends object> {
  constructor(protected readonly knex: Knex, protected readonly sqlite3: Sqlite3) {}
  protected abstract readonly schema: Schema;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  protected async createOrUpdate(row: unknown): Promise<Row>;
  protected async createOrUpdate(row: unknown, id: string): Promise<Row | null>;
  protected async createOrUpdate(row: unknown, id?: string): Promise<Row | null> {
    const fields = mapValues(omit(pick(row, this.fields), ['id']), (v) =>
      isObject(v) ? JSON.stringify(v) : v,
    ) as Partial<Row>;
    let updatedRow: Row;

    if (typeof id === 'string') {
      const updatedRows = await this.knex(this.schema.tableName)
        .update(fields)
        .where('id', id)
        .returning(this.knex.raw('*'));

      if (updatedRows.length === 0) {
        return null;
      }

      updatedRow = updatedRows[0];
    } else {
      const createdRows = await this.knex(this.schema.tableName).insert(fields).returning(this.knex.raw('*'));
      updatedRow = createdRows[0];
    }

    return updatedRow;
  }
}
