import type { Selectable } from 'kysely';
import type { MemoPatchDTO, Memo, Duration } from '@domain/server/model/memo.js';
import type { MemoRepository, MemoQuery } from '@domain/server/repository/memoRepository.js';

import schema, { type Row } from '../schema/memo.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  private readonly tableName = schema.tableName;

  public async create(memo: Memo) {
    await this.db.insertInto(this.tableName).values({ ...memo, isPinned: memo.isPinned ? 1 : 0 });
    return memo;
  }

  public async findLatest() {
    const row = await this.db.selectFrom(this.tableName).selectAll().orderBy('index desc').limit(1).executeTakeFirst();

    return row ? SqliteMemoRepository.rowToMemo(row) : null;
  }

  public async update(id: Memo['id'], patch: MemoPatchDTO) {
    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set({ ...patch, isPinned: patch.isPinned ? 1 : 0 })
      .returningAll()
      .executeTakeFirst();

    if (!updatedRow) {
      return null;
    }

    return SqliteMemoRepository.rowToMemo(updatedRow);
  }

  public async findOneById(id: Memo['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db.selectFrom(this.tableName).where('id', '=', id).selectAll();

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    if (!row) {
      return null;
    }

    return SqliteMemoRepository.rowToMemo(row);
  }

  private static rowToMemo(row: Selectable<Row>): Memo {
    return { ...row, isPinned: Boolean(row.isPinned) };
  }

  public async findAll(q: MemoQuery) {
    let sql = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (typeof q.isAvailableOnly === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailableOnly ? 'is' : 'is not', null);
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

    if (q.orderBy?.by === 'index') {
      sql = sql.orderBy('index', q.orderBy.order);
    }

    if (q.limit) {
      sql = sql.limit(q.limit);
    }

    const rows = await sql.execute();

    return rows.map(SqliteMemoRepository.rowToMemo);
  }

  public async findAvailableBetween(q: Duration) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .where((eb) =>
        eb.and([
          eb(`${this.tableName}.createdAt`, '>=', q.startTime),
          eb(`${this.tableName}.createdAt`, '<', q.endTime),
          eb(`${recyclableTableName}.entityId`, 'is', null),
        ]),
      )
      .select(['createdAt'])
      .execute();

    return rows;
  }
}
