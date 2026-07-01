import { compact } from 'lodash-es';

import type { MemoPatchDTO, Memo, ClientMemoQuery } from '#domain/server/model/memo.js';
import type { MemoRepository, MemoQuery } from '#domain/server/repository/memoRepository.js';
import { markdownToPlain } from '#domain/shared/infra/markdown/parse.js';
import { EntityTypes } from '#domain/shared/model/entity.js';

import BaseRepository from './BaseRepository.js';
import schema from '../schema/note.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  private readonly tableName = schema.tableName;

  public async create(memo: Memo) {
    const bodyPlainText = markdownToPlain(memo.body);
    await this.db
      .insertInto(this.tableName)
      .values({ ...memo, bodyPlainText, type: EntityTypes.Memo })
      .execute();

    return memo;
  }

  public async update(id: Memo['id'], patch: MemoPatchDTO) {
    const bodyPlainText = typeof patch.body === 'string' ? markdownToPlain(patch.body) : undefined;
    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where((eb) => eb.and([eb('id', '=', id), eb('type', '=', EntityTypes.Memo)]))
      .set({
        ...patch,
        bodyPlainText,
      })
      .returningAll()
      .executeTakeFirst();

    return updatedRow ?? null;
  }

  public async findOneById(id: Memo['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('id', '=', id)
      .where('type', '=', EntityTypes.Memo)
      .select(['id', 'body', 'parentId', `${this.tableName}.createdAt`, 'updatedAt']);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    return row ?? null;
  }

  public async findAll(q: MemoQuery) {
    const rows = await this.getQueryListSql(q).execute();
    return rows;
  }

  public async queryCount(q?: ClientMemoQuery) {
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
        `${this.tableName}.parentId`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .where(`${this.tableName}.type`, '=', EntityTypes.Memo)
      .distinct(); // 联 topic 表会导致查出同样的记录，需要去重

    if (typeof q.isAvailableOnly === 'boolean') {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailableOnly ? 'is' : 'is not', null);
    }

    if (q.durations && q.durations.length > 0) {
      const { durations } = q;
      sql = sql.where((eb) =>
        eb.or(
          durations.map(({ startTime, endTime }) => {
            let start;
            let end;

            if (startTime) {
              if (!q.startId) {
                start = eb(`${this.tableName}.createdAt`, '>=', startTime);
              } else {
                start = eb.or([
                  eb(`${this.tableName}.createdAt`, '>', startTime),
                  eb.and([eb(`${this.tableName}.createdAt`, '=', startTime), eb('id', '>', q.startId)]),
                ]);
              }
            }

            if (endTime) {
              if (!q.endId) {
                end = eb(`${this.tableName}.createdAt`, '<=', endTime);
              } else {
                end = eb.or([
                  eb(`${this.tableName}.createdAt`, '<', endTime),
                  eb.and([eb(`${this.tableName}.createdAt`, '=', endTime), eb('id', '<', q.endId)]),
                ]);
              }
            }

            return eb.and(compact([start, end]));
          }),
        ),
      );
    }

    if (q.id) {
      sql = sql.where(`${this.tableName}.id`, Array.isArray(q.id) ? 'in' : '=', q.id);
    }

    if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    sql = sql
      .orderBy(`${this.tableName}.createdAt`, q.order ?? 'desc')
      .orderBy(`${this.tableName}.id`, q.order ?? 'desc');

    if (q.limit) {
      sql = sql.limit(q.limit);
    }

    return sql;
  }
}
