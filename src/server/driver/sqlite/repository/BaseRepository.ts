import { randomUUID } from 'node:crypto';
import type { Kysely } from 'kysely';
import pick from 'lodash/pick';
import omit from 'lodash/omit';

import type { Schema } from '../schema/type';
import type { Db } from '../Database';

export default abstract class BaseRepository<Row extends object> {
  constructor(protected readonly db: Kysely<Db>) {}
  protected abstract readonly schema: Schema<keyof Db>;
  private get fields() {
    return Object.keys(this.schema.fields);
  }

  protected async _batchCreate<T = void>(
    rows: Partial<T extends void ? Row : T>[],
    tableName?: keyof Db,
  ): Promise<(T extends void ? Row : T)[]> {
    const fields = this.fields;

    const createdRows = (await this.db
      .insertInto(tableName || this.schema.tableName)
      .values(rows.map((row) => ('id' in fields ? row : { ...row, id: this.generateId() })))
      .returningAll()
      .execute()) as unknown as (T extends void ? Row : T)[];

    return createdRows;
  }

  private generateId() {
    return randomUUID().replaceAll('-', '');
  }

  protected async _createOrUpdate(row: unknown): Promise<Row>;
  protected async _createOrUpdate(row: unknown, id: string): Promise<Row | null>;
  protected async _createOrUpdate(row: unknown, id?: string): Promise<Row | null> {
    const fields = pick(row, this.fields) as Partial<Row>;
    let updatedRow: Row | undefined;

    if (typeof id === 'string') {
      updatedRow = (await this.db
        .updateTable(this.schema.tableName)
        .set(omit(fields, 'id'))
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst()) as unknown as Row | undefined;

      if (updatedRow) {
        return null;
      }
    } else {
      updatedRow = (await this.db
        .insertInto(this.schema.tableName)
        .values({ ...fields, id: 'id' in fields ? fields.id : this.generateId() })
        .returningAll()
        .executeTakeFirst()) as unknown as Row;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return updatedRow!;
  }
}
