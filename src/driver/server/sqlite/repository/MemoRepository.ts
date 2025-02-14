import type { Selectable } from 'kysely';
import { compact } from 'lodash-es';

import type { MemoPatchDTO, Memo } from '#domain/server/model/memo.js';
import type { MemoRepository, MemoQuery, CountQuery } from '#domain/server/repository/memoRepository.js';

import schema, { type Row } from '../schema/memo.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as topicTableName } from '../schema/topic.js';
import BaseRepository from './BaseRepository.js';

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  private readonly tableName = schema.tableName;

  public async create(memo: Required<Memo>) {
    await this.db
      .insertInto(this.tableName)
      .values({ ...memo, isPinned: memo.isPinned ? 1 : 0 })
      .execute();
    return memo;
  }

  public async update(id: Memo['id'], patch: MemoPatchDTO) {
    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where('id', '=', id)
      .set({ ...patch, isPinned: typeof patch.isPinned === 'boolean' ? (patch.isPinned ? 1 : 0) : undefined })
      .returningAll()
      .executeTakeFirst();

    if (!updatedRow) {
      return null;
    }

    return SqliteMemoRepository.rowToMemo(updatedRow);
  }

  public async findOneById(id: Memo['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('id', '=', id)
      .select(['id', 'body', 'isPinned', 'parentId', `${this.tableName}.createdAt`, 'updatedAt']);

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

  private static rowToMemo(row: Omit<Selectable<Row>, 'bodyPlainText'>): Memo {
    return { ...row, isPinned: Boolean(row.isPinned) };
  }

  public async findAll(q: MemoQuery) {
    const rows = await this.getQueryListSql(q).execute();
    return rows.map(SqliteMemoRepository.rowToMemo);
  }

  public async queryCount(q?: CountQuery) {
    const { count } = await this.getQueryListSql(q || {})
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .executeTakeFirstOrThrow();

    return count;
  }

  private getQueryListSql(q: MemoQuery) {
    let sql = this.db
      .selectFrom(this.tableName)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.body`,
        `${this.tableName}.isPinned`,
        `${this.tableName}.parentId`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .distinct(); // 联 topic 表会导致查出同样的记录，需要去重

    if (typeof q.isAvailableOnly === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailableOnly ? 'is' : 'is not', null);
    }

    if (q.tags && q.tags.length > 0) {
      sql = sql
        .innerJoin(topicTableName, `${topicTableName}.entityId`, `${this.tableName}.id`)
        .where(`${topicTableName}.name`, 'in', q.tags);
    }

    if (q.durations && q.durations.length > 0) {
      const { durations } = q;
      sql = sql.where((eb) =>
        eb.or(
          durations.map(({ startTime, endTime }) => {
            let start;
            let end;
            const field = q.orderBy ?? 'createdAt';

            if (startTime) {
              if (!q.startId) {
                start = eb(`${this.tableName}.${field}`, '>=', startTime);
              } else {
                start = eb.or([
                  eb(`${this.tableName}.${field}`, '>', startTime),
                  eb.and([eb(`${this.tableName}.${field}`, '=', startTime), eb('id', '>', q.startId)]),
                ]);
              }
            }

            if (endTime) {
              if (!q.endId) {
                end = eb(`${this.tableName}.${field}`, '<=', endTime);
              } else {
                end = eb.or([
                  eb(`${this.tableName}.${field}`, '<', endTime),
                  eb.and([eb(`${this.tableName}.${field}`, '=', endTime), eb('id', '<', q.endId)]),
                ]);
              }
            }

            return eb.and(compact([start, end]));
          }),
        ),
      );
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
      sql = sql.orderBy([`${this.tableName}.createdAt ${q.order ?? 'desc'}`, `id ${q.order ?? 'desc'}`]);
    }

    if (q.orderBy === 'updatedAt') {
      sql = sql.orderBy([`${this.tableName}.updatedAt ${q.order ?? 'desc'}`, `id ${q.order ?? 'desc'}`]);
    }

    if (q.limit) {
      sql = sql.limit(q.limit);
    }

    return sql;
  }
}
