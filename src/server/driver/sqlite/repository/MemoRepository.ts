import omit from 'lodash/omit';
import fromPairs from 'lodash/fromPairs';

import { sql, type Selectable } from 'kysely';
import type { MemoPatchDTO, MemoQuery, Memo, NewMemo } from 'model/memo';
import type { MemoRepository } from 'service/repository/MemoRepository';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/memo';
import { tableName as recyclableTableName } from '../schema/recyclable';

export default class SqliteMemoRepository extends HierarchyEntityRepository implements MemoRepository {
  readonly tableName = schema.tableName;
  async create(memo: NewMemo) {
    const createdRow = await this.createOne(this.tableName, {
      ...memo,
      id: memo.id || this.generateId(),
      content: memo.content || '',
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
    return {
      ...omit(row, ['isPinned']),
      ...(row.parentId ? { isPinned: Boolean(row.isPinned) } : null),
    };
  }

  async findAll(q?: MemoQuery) {
    let sql = this.db.selectFrom(this.tableName).selectAll(this.tableName);

    if (typeof q?.isAvailable === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailable ? 'is' : 'is not', null);
    }

    if (q?.updatedAfter) {
      sql = sql.where('updatedAt', '>', q.updatedAfter);
    }

    if (q?.createdAfter) {
      sql = sql.where('createdAt', '>=', q.createdAfter);
    }

    if (q?.createdBefore) {
      sql = sql.where('createdAt', '<', q.createdBefore);
    }

    if (q?.id) {
      sql = sql.where('id', 'in', q.id);
    }

    if (typeof q?.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (q?.orderBy === 'createdAt') {
      sql = sql.orderBy('createdAt desc');
    }

    if (q?.limit) {
      sql = sql.limit(q.limit);
    }

    const rows = await sql.execute();

    return rows.map(SqliteMemoRepository.rowToMemo);
  }

  async removeById(id: Memo['id']) {
    await this.db.deleteFrom(this.tableName).where('id', '=', id).execute();
  }

  async queryAvailableDates() {
    const rows = await this.db
      .selectFrom(this.tableName)
      .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
      .where(`${recyclableTableName}.entityId`, 'is', null)
      .groupBy(sql`date(createdAt / 1000, 'unixepoch')`)
      .select(({ fn }) => [
        fn.count<number>('id').as('count'),
        sql<string>`date(createdAt / 1000, 'unixepoch')`.as('date'),
      ])
      .execute();

    return fromPairs(rows.map(({ date, count }) => [date, count]));
  }
}
