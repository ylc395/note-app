import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';

import type { MemoPaginationQuery, ParentMemoVO, ChildMemoVO, MemoVO } from 'interface/memo';
import type { MemoRepository, Memo, MemoQuery } from 'service/repository/MemoRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/memo';

export default class SqliteMemoRepository extends BaseRepository<Row> implements MemoRepository {
  protected readonly schema = schema;
  async create(memo: Memo) {
    const createdRow = await this._createOrUpdate(memo);

    if (createdRow.id) {
      return SqliteMemoRepository.rowToVO(createdRow, []);
    }

    return SqliteMemoRepository.rowToVO(createdRow);
  }

  async update(id: ParentMemoVO['id'], patch: Memo) {
    const updatedRow = await this._createOrUpdate(patch, id);

    if (!updatedRow) {
      return null;
    }

    return await this.findOneById(updatedRow.id);
  }

  async list(query: MemoPaginationQuery) {
    const pageSize = query.pageSize || 50;
    const page = query.page || 1;
    const rows = await this.db
      .selectFrom(this.schema.tableName)
      .where('parentId', 'is', null)
      .orderBy('isPinned', 'desc')
      .orderBy('id', 'desc')
      .selectAll()
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    const total = await this.db
      .selectFrom(this.schema.tableName)
      .where('parentId', 'is', null)
      .select(this.db.fn.countAll<number>().as('count'))
      .executeTakeFirst();

    const childrenMap = groupBy(await this.findChildren(rows.map(({ id }) => id)), 'parentId');
    const list = rows.map((row) => SqliteMemoRepository.rowToVO(row, childrenMap[row.id] || []));

    return { list, total: Number(total?.count) };
  }

  private async findChildren(parentId: ParentMemoVO['id'] | ParentMemoVO['id'][]) {
    const children = await this.db
      .selectFrom(this.schema.tableName)
      .where('parentId', typeof parentId === 'string' ? '=' : 'in', parentId)
      .selectAll()
      .orderBy('id', 'desc')
      .execute();

    return children;
  }

  async findParent(id: ParentMemoVO['id']) {
    const target = await this.db.selectFrom(this.schema.tableName).where('id', '=', id).selectAll().executeTakeFirst();

    if (!target?.parentId) {
      return null;
    }

    const parent = await this.db
      .selectFrom(this.schema.tableName)
      .where('id', '=', target.parentId)
      .selectAll()
      .executeTakeFirst();

    if (!parent) {
      return null;
    }

    const children = await this.findChildren(String(parent.id));
    return SqliteMemoRepository.rowToVO(parent, children);
  }

  async findOneById(id: MemoVO['id']) {
    const row = await this.db.selectFrom(this.schema.tableName).where('id', '=', id).selectAll().executeTakeFirst();

    if (!row) {
      return null;
    }

    if (row.parentId) {
      const children = await this.findChildren(row.id);
      return SqliteMemoRepository.rowToVO(row, children);
    } else {
      return SqliteMemoRepository.rowToVO(row);
    }
  }

  private static rowToVO(row: Row): ChildMemoVO;
  private static rowToVO(row: Row, threads: Row[]): ParentMemoVO;
  private static rowToVO(row: Row, threads?: Row[]): ParentMemoVO | ChildMemoVO {
    return {
      ...omit(row, ['parentId', 'isPinned']),
      isStar: false,
      ...(threads
        ? {
            isPinned: Boolean(row.isPinned),
            threads: threads.map((child) => SqliteMemoRepository.rowToVO(child)),
          }
        : null),
    };
  }

  async findAll(q?: MemoQuery) {
    let sql = this.db.selectFrom(this.schema.tableName).selectAll();

    if (q) {
      sql = sql.where('updatedAt', '>', q.updatedAt);
    }

    const rows = await sql.execute();

    return rows.map((row) =>
      row.parentId ? SqliteMemoRepository.rowToVO(row, []) : SqliteMemoRepository.rowToVO(row),
    );
  }

  async removeById(id: MemoVO['id']) {
    await this.db.deleteFrom(this.schema.tableName).where('id', '=', id).execute();
  }
}
