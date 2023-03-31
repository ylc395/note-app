import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';

import type { MemoDTO, MemoPatchDTO, MemoQuery, MemoVO } from 'interface/memo';
import type { MemoRepository } from 'service/repository/MemoRepository';

import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/memo';

export default class SqliteMemoRepository extends BaseRepository<Row> implements MemoRepository {
  protected readonly schema = schema;
  async create(memo: MemoDTO) {
    const createdRow = await this.createOrUpdate(memo);

    return SqliteMemoRepository.rowToVO(createdRow);
  }

  async update(id: MemoVO['id'], patch: MemoPatchDTO) {
    const updatedRow = await this.createOrUpdate(patch, id);

    if (!updatedRow) {
      return null;
    }

    return SqliteMemoRepository.rowToVO(updatedRow);
  }

  async findAll(query: MemoQuery) {
    const pageSize = query.pageSize || 50;
    const page = query.page || 1;
    const rows = await this.knex<Row>(this.schema.tableName)
      .whereNull('parentId')
      .orderBy('id', 'createdAt')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = (await this.knex(this.schema.tableName).whereNull('parentId').count(this.knex.raw('*'))) as any;

    const children = await this.knex<Row>(this.schema.tableName).whereIn(
      'parentId',
      rows.map((row) => row.id),
    );

    const childrenMap = groupBy(children, 'parentId');
    const list = rows.map((row) => SqliteMemoRepository.rowToVO(row, childrenMap[row.id]));

    return { list, total: Number(total[0].count) };
  }

  async findParent(id: MemoVO['id']) {
    const target = await this.knex<Row>(this.schema.tableName).where('id', id).first();

    if (!target || !target.parentId) {
      return null;
    }

    const parent = await this.knex<Row>(this.schema.tableName).where('id', target.parentId).first();

    return parent ? SqliteMemoRepository.rowToVO(parent) : null;
  }

  private static rowToVO(row: Row, threads?: Row[]): MemoVO {
    return {
      ...omit(row, 'parentId'),
      id: String(row.id),
      isPinned: Boolean(row.isPinned),
      isStar: false,
      threads: threads?.map((child) => SqliteMemoRepository.rowToVO(child)) || [],
    };
  }
}
