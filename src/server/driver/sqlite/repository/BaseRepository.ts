import pick from 'lodash/pick';
import omit from 'lodash/omit';

import type { Schema } from '../schema/type';
import type { Knex } from 'knex';

export default abstract class BaseRepository<Row extends object> {
  constructor(protected readonly knex: Knex) {}
  protected abstract readonly schema: Schema;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  protected async createOrUpdate(row: unknown): Promise<Row>;
  protected async createOrUpdate(row: unknown, id: string): Promise<Row | null>;
  protected async createOrUpdate(row: unknown, id?: string): Promise<Row | null> {
    const fields = omit(pick(row, this.fields), ['id']) as Partial<Row>;
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
