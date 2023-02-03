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

  protected async assertExistenceById(id: string, tableName?: string | Knex.Transaction, trx?: Knex.Transaction) {
    const _tableName = typeof tableName === 'string' ? tableName : this.schema.tableName;
    const _trx = trx || (typeof tableName === 'function' ? tableName : this.knex);
    const row = await _trx(_tableName).where('id', Number(id)).first();

    if (!row) {
      throw new Error(`invalid id ${id} in ${_tableName} table`);
    }
  }

  protected async createOrUpdate(row: unknown, id?: string | Knex.Transaction, trx?: Knex.Transaction): Promise<Row> {
    const fields = pick(row, this.fields) as Partial<Row>;
    const _trx = typeof id === 'function' ? id : trx || this.knex;
    let updatedRow: Row;

    if (typeof id === 'string') {
      const updatedRows = await _trx(this.schema.tableName)
        .update(fields)
        .where('id', id)
        .returning(this.knex.raw('*'));

      if (updatedRows.length === 0) {
        throw new Error(`invalid id ${id} in table ${this.schema.tableName} when update`);
      }

      updatedRow = updatedRows[0];
    } else {
      const createdRows = await _trx(this.schema.tableName).insert(fields).returning(this.knex.raw('*'));
      updatedRow = createdRows[0];
    }

    return updatedRow;
  }
}
