import { sql, type Selectable } from 'kysely';

import type { MemoPatchDTO, MemoQuery, Memo, MemoDTO, Duration } from '@domain/model/memo.js';
import type { MemoRepository } from '@domain/service/repository/MemoRepository.js';

import schema, { type Row } from '../schema/memo.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  readonly tableName = schema.tableName;
  async create(memo: MemoDTO) {
    const createdRow = await this.createOneOn(this.tableName, {
      ...memo,
      id: this.generateId(),
      isPinned: memo.isPinned ? 1 : 0,
    });

    return SqliteMemoRepository.rowToMemo(createdRow);
  }

  async update(id: Memo['id'], patch: MemoPatchDTO) {
    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set({ ...patch, isPinned: patch.isPinned ? 1 : 0, updatedAt: Date.now() })
      .returningAll()
      .executeTakeFirst();

    if (!updatedRow) {
      return null;
    }

    return await this.findOneById(updatedRow.id);
  }

  async findParent(id: Memo['id']) {
    const target = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();

    if (!target?.parentId) {
      return null;
    }

    const parent = await this.db
      .selectFrom(this.tableName)
      .where('id', '=', target.parentId)
      .selectAll()
      .executeTakeFirst();

    if (!parent) {
      return null;
    }

    return SqliteMemoRepository.rowToMemo(parent);
  }

  async findOneById(id: Memo['id']) {
    const row = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();

    if (!row) {
      return null;
    }

    return SqliteMemoRepository.rowToMemo(row);
  }

  private static rowToMemo(row: Selectable<Row>): Memo {
    return { ...row, isPinned: Boolean(row.isPinned) };
  }

  async findAll(q: MemoQuery) {
    let sql = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (typeof q.isAvailable === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q.startTime) {
      sql = sql.where('createdAt', '>=', q.startTime);
    }

    if (q.endTime) {
      sql = sql.where('createdAt', '<', q.endTime);
    }

    if (q.id) {
      sql = sql.where('id', Array.isArray(q.id) ? 'in' : '=', q.id);
    }

    if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (typeof q.isPinned === 'boolean') {
      sql = sql.where('isPinned', '=', q.isPinned ? 1 : 0);
    }

    if (q.orderBy === 'createdAt') {
      sql = sql.orderBy('createdAt desc');
    }

    if (q.limit) {
      sql = sql.limit(q.limit);
    }

    const rows = await sql.execute();

    return rows.map(SqliteMemoRepository.rowToMemo);
  }

  async queryAvailableDates({ startTime, endTime }: Duration) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .where(`${this.tableName}.createdAt`, '>', startTime)
      .where(`${this.tableName}.createdAt`, '<', endTime)
      .groupBy(sql`date(createdAt / 1000, 'unixepoch')`)
      .select(({ fn }) => [
        fn.count<number>('id').as('count'),
        sql<string>`date(createdAt / 1000, 'unixepoch')`.as('date'),
      ])
      .execute();

    return rows;
  }
}
