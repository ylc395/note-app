import omit from 'lodash/omit';

import type { Selectable } from 'kysely';
import type { ParentMemoVO, ChildMemoVO, MemoVO, MemoDTO, MemoPatchDTO, MemoQuery } from 'model/memo';
import type { MemoRepository } from 'service/repository/MemoRepository';

import HierarchyEntityRepository from './HierarchyEntityRepository';
import schema, { type Row } from '../schema/memo';

export default class SqliteMemoRepository extends HierarchyEntityRepository implements MemoRepository {
  readonly tableName = schema.tableName;
  async create(memo: MemoDTO) {
    const createdRow = await this.createOne(this.tableName, {
      ...memo,
      id: this.generateId(),
      isPinned: memo.isPinned ? 1 : 0,
    });

    if (createdRow.id) {
      return SqliteMemoRepository.rowToVO(createdRow, []);
    }

    return SqliteMemoRepository.rowToVO(createdRow);
  }

  async update(id: ParentMemoVO['id'], patch: MemoPatchDTO) {
    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set({ ...patch, isPinned: patch.isPinned ? 1 : 0 })
      .returningAll()
      .executeTakeFirst();

    if (!updatedRow) {
      return null;
    }

    return await this.findOneById(updatedRow.id);
  }

  private async findChildren(parentId: ParentMemoVO['id'] | ParentMemoVO['id'][]) {
    const children = await this.db
      .selectFrom(this.tableName)
      .where('parentId', typeof parentId === 'string' ? '=' : 'in', parentId)
      .selectAll()
      .orderBy('id', 'desc')
      .execute();

    return children;
  }

  async findParent(id: ParentMemoVO['id']) {
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

    const children = await this.findChildren(String(parent.id));
    return SqliteMemoRepository.rowToVO(parent, children);
  }

  async findOneById(id: MemoVO['id']) {
    const row = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();

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

  private static rowToVO(row: Selectable<Row>): ChildMemoVO;
  private static rowToVO(row: Selectable<Row>, threads: Selectable<Row>[]): ParentMemoVO;
  private static rowToVO(row: Selectable<Row>, threads?: Selectable<Row>[]): ParentMemoVO | ChildMemoVO {
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
    let sql = this.db.selectFrom(this.tableName).selectAll();

    if (q?.updatedAt) {
      sql = sql.where('updatedAt', '>', q.updatedAt);
    }

    if (q?.id) {
      sql = sql.where('id', 'in', q.id);
    }

    const rows = await sql.execute();

    return rows.map((row) =>
      row.parentId ? SqliteMemoRepository.rowToVO(row) : SqliteMemoRepository.rowToVO(row, []),
    );
  }

  async removeById(id: MemoVO['id']) {
    await this.db.deleteFrom(this.tableName).where('id', '=', id).execute();
  }
}
