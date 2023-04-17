import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';

import type { Schema } from '../schema/type';

export default abstract class BaseRepository<Row extends object> {
  constructor(protected readonly knex: Knex) {}
  protected abstract readonly schema: Schema;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  protected async _batchCreate<T = void>(
    rows: Partial<T extends void ? Row : T>[],
    tableName?: string,
  ): Promise<(T extends void ? Row : T)[]> {
    const createdRows = await this.knex(tableName || this.schema.tableName)
      .insert(rows.map((row) => ({ ...row, id: this.generateId() })))
      .returning(this.knex.raw('*'));

    return createdRows;
  }

  private generateId() {
    return randomUUID().replaceAll('-', '');
  }
  protected async _createOrUpdate(row: unknown): Promise<Row>;
  protected async _createOrUpdate(row: unknown, id: string): Promise<Row | null>;
  protected async _createOrUpdate(row: unknown, id?: string): Promise<Row | null> {
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
      const createdRows = await this.knex(this.schema.tableName)
        .insert({ ...fields, id: this.generateId() })
        .returning(this.knex.raw('*'));
      updatedRow = createdRows[0];
    }

    return updatedRow;
  }
}
