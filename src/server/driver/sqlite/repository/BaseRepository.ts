import type { Knex } from 'knex';
import pick from 'lodash/pick';

import db from 'driver/sqlite';

import type { Schema } from '../schema/type';
import noteSchema from '../schema/noteSchema';
import recyclableSchema, { RecyclablesTypes } from '../schema/recyclableSchema';

const DELETABLE_ENTITY_TABLES: Record<Schema['tableName'], RecyclablesTypes> = {
  [noteSchema.tableName]: RecyclablesTypes.Note,
};

export default abstract class BaseRepository<Row extends object> {
  protected get knex() {
    return db.knex;
  }
  protected abstract readonly schema: Schema;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  private get recyclableTypes() {
    return DELETABLE_ENTITY_TABLES[this.schema.tableName];
  }

  protected async assertExistenceById(id: string, trx?: Knex.Transaction) {
    const _trx = trx || this.knex;
    const sql = _trx<Row>(this.schema.tableName).where('id', Number(id));

    if (this.recyclableTypes) {
      const { recyclableTypes, knex } = this;
      sql
        .leftJoin(recyclableSchema.tableName, function () {
          this.on(`${recyclableSchema.tableName}.type`, '=', knex.raw(recyclableTypes));
          this.on(`${recyclableSchema.tableName}.entityId`, knex.raw(Number(id)));
        })
        .andWhere(`${recyclableSchema.tableName}.entityId`, null);
    }

    const row = await sql.first();

    if (!row) {
      throw new Error(`invalid id ${id} in ${this.schema.tableName} table`);
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

  async batchUpdate(payloads: Record<string, unknown>, trx?: Knex.Transaction): Promise<Row[]> {
    const _trx = trx || (await this.knex.transaction());

    try {
      const rows = [];
      for (const [id, payload] of Object.entries(payloads)) {
        const fields = pick(payload, this.fields) as Partial<Row>;
        const updatedRows = await _trx(this.schema.tableName)
          .update(fields)
          .where('id', id)
          .returning(this.knex.raw('*'));

        rows.push(...updatedRows);
      }

      if (rows.length !== Object.keys(payloads).length) {
        throw new Error('invalid ids');
      }

      await _trx.commit();

      return rows;
    } catch (error) {
      _trx.rollback();
      throw error;
    }
  }
}
