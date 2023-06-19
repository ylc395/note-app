import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import pick from 'lodash/pick';
import omit from 'lodash/omit';

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
    const fields = this.fields;

    const createdRows = await this.knex(tableName || this.schema.tableName)
      .insert(rows.map((row) => ('id' in fields ? row : { ...row, id: this.generateId() })))
      .returning(this.knex.raw('*'));

    return createdRows;
  }

  private generateId() {
    return randomUUID().replaceAll('-', '');
  }

  protected async _createOrUpdate(row: unknown): Promise<Row>;
  protected async _createOrUpdate(row: unknown, id: string): Promise<Row | null>;
  protected async _createOrUpdate(row: unknown, id?: string): Promise<Row | null> {
    const fields = pick(row, this.fields) as Partial<Row>;
    let updatedRow: Row;

    if (typeof id === 'string') {
      const updatedRows = await this.knex(this.schema.tableName)
        .update(omit(fields, 'id'))
        .where('id', id)
        .returning(this.knex.raw('*'));

      if (updatedRows.length === 0) {
        return null;
      }

      updatedRow = updatedRows[0];
    } else {
      const createdRows = await this.knex(this.schema.tableName)
        .insert({ ...fields, id: 'id' in fields ? fields.id : this.generateId() })
        .returning(this.knex.raw('*'));
      updatedRow = createdRows[0];
    }

    return updatedRow;
  }
}
