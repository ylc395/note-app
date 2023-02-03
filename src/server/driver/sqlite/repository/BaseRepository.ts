import type { Knex } from 'knex';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';

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
    const jsonFields = pick(row, this.schema.jsonFields);
    const fields = pick(row, this.fields) as Row;
    const isNewTrx = !isEmpty(jsonFields) && !trx && typeof id !== 'object';
    const _trx = typeof id === 'function' ? id : trx || (isNewTrx ? await this.knex.transaction() : this.knex);
    let _id: string;
    let updatedRow: Row;

    try {
      if (typeof id === 'string') {
        _id = id;
        const updatedRows = await _trx(this.schema.tableName)
          .update(fields)
          .where('id', _id)
          .returning(Object.keys(this.schema.fields));

        if (updatedRows.length === 0) {
          throw new Error(`invalid id ${_id} in table ${this.schema.tableName} when update`);
        }

        updatedRow = updatedRows[0];
      } else {
        const createdRows = await _trx(this.schema.tableName).insert(fields).returning(Object.keys(this.schema.fields));
        updatedRow = createdRows[0];
        _id = String(createdRows[0].id);
      }

      if (jsonFields) {
        for (const [key, value] of Object.entries(jsonFields)) {
          await _trx(this.schema.tableName).jsonSet('json', `$.${key}`, value).where('id', _id);
        }
      }

      if (isNewTrx) {
        await (_trx as Knex.Transaction).commit();
      }

      return updatedRow;
    } catch (error) {
      if (isNewTrx) {
        await (_trx as Knex.Transaction).rollback();
      }

      throw error;
    }
  }
}
