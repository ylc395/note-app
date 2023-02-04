import type { Knex } from 'knex';
import pick from 'lodash/pick';

import db from 'driver/sqlite';

import type { Schema } from '../schema/type';

export default abstract class BaseRepository<Row extends object> {
  protected get knex() {
    return db.knex;
  }
  protected abstract readonly schema: Schema;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  protected async createOrUpdate(row: unknown, trx?: Knex.Transaction): Promise<Row>;
  protected async createOrUpdate(row: unknown, id?: string | Knex.Transaction, trx?: Knex.Transaction): Promise<Row>;
  protected async createOrUpdate(
    row: unknown,
    id?: string | Knex.Transaction,
    trx?: Knex.Transaction,
  ): Promise<Row | null> {
    const fields = pick(row, this.fields) as Partial<Row>;
    const _trx = typeof id === 'function' ? id : trx || this.knex;
    let updatedRow: Row;

    if (typeof id === 'string') {
      const updatedRows = await _trx(this.schema.tableName)
        .update(fields)
        .where('id', id)
        .returning(this.knex.raw('*'));

      if (updatedRows.length === 0) {
        return null;
      }

      updatedRow = updatedRows[0];
    } else {
      const createdRows = await _trx(this.schema.tableName).insert(fields).returning(this.knex.raw('*'));
      updatedRow = createdRows[0];
    }

    return updatedRow;
  }
}
