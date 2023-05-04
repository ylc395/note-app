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
    const rows = await this.knex<Row>(this.schema.tableName)
      .whereNull('parentId')
      .orderBy([
        { column: 'isPinned', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = (await this.knex(this.schema.tableName).whereNull('parentId').count(this.knex.raw('*'))) as any;
    const childrenMap = groupBy(await this.findChildren(rows.map(({ id }) => String(id))), 'parentId');
    const list = rows.map((row) => SqliteMemoRepository.rowToVO(row, childrenMap[row.id] || []));

    return { list, total: Number(total[0].count) };
  }

  private async findChildren(parentId: ParentMemoVO['id'] | ParentMemoVO['id'][]) {
    const children = await this.knex<Row>(this.schema.tableName)
      .where('parentId', typeof parentId === 'string' ? '=' : 'in', parentId)
      .orderBy([{ column: 'id', order: 'desc' }]);
    return children;
  }

  async findParent(id: ParentMemoVO['id']) {
    const target = await this.knex<Row>(this.schema.tableName).where('id', id).first();

    if (!target || !target.parentId) {
      return null;
    }

    const parent = await this.knex<Row>(this.schema.tableName).where('id', target.parentId).first();

    if (!parent) {
      return null;
    }

    const children = await this.findChildren(String(parent.id));
    return SqliteMemoRepository.rowToVO(parent, children);
  }

  async findOneById(id: MemoVO['id']) {
    const row = await this.knex<Row>(this.schema.tableName).where('id', id).first();

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
    let sql = this.knex<Row>(this.schema.tableName).select();

    if (q) {
      sql = sql.andWhere('updatedAt', '>', q.updatedAt);
    }

    const rows = await sql;

    return rows.map((row) =>
      row.parentId ? SqliteMemoRepository.rowToVO(row, []) : SqliteMemoRepository.rowToVO(row),
    );
  }

  async removeById(id: MemoVO['id']) {
    await this.knex<Row>(this.schema.tableName).delete().where('id', id);
  }
}
