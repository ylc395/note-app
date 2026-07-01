import { compact, pick } from 'lodash-es';
import { sql } from 'kysely';

import type { Memo, ClientMemoQuery } from '#domain/server/model/memo.js';
import type { MemoRepository, MemoQuery, MemoPatch } from '#domain/server/repository/memoRepository.js';
import { markdownToPlain } from '#domain/shared/infra/markdown/parse.js';
import { EntityTypes } from '#domain/shared/model/entity.js';

import BaseRepository from './BaseRepository.js';
import schema from '../schema/note.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';

interface MemoDetails {
  isPinned?: boolean;
}

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  private readonly tableName = schema.tableName;

  private static toMemo(row: Omit<Memo, 'isPinned'> & { details: MemoDetails | null }): Memo {
    const { details, ...rest } = row;
    return { ...rest, isPinned: Boolean(details?.isPinned) };
  }

  public async create(memo: Memo) {
    const bodyPlainText = markdownToPlain(memo.body);
    await this.db
      .insertInto(this.tableName)
      .values({
        ...pick(memo, ['id', 'parentId', 'body', 'createdAt', 'updatedAt']),
        bodyPlainText,
        type: EntityTypes.Memo,
        details: JSON.stringify({ isPinned: memo.isPinned }),
      })
      .execute();

    return memo;
  }

  public async update(id: Memo['id'], patch: MemoPatch) {
    const setClause: Record<string, unknown> = {};

    if (typeof patch.body === 'string') {
      setClause.body = patch.body;
      setClause.bodyPlainText = markdownToPlain(patch.body);
    }

    if (typeof patch.isPinned === 'boolean') {
      setClause.details = JSON.stringify({ isPinned: patch.isPinned });
    }

    if (typeof patch.updatedAt === 'number') {
      setClause.updatedAt = patch.updatedAt;
    }

    const updatedRow = await this.db
      .updateTable(this.tableName)
      .where((eb) => eb.and([eb('id', '=', id), eb('type', '=', EntityTypes.Memo)]))
      .set(setClause)
      .returning(['id', 'body', 'parentId', 'details', 'createdAt', 'updatedAt'])
      .executeTakeFirst();

    return updatedRow ? SqliteMemoRepository.toMemo(updatedRow) : null;
  }

  public async findOneById(id: Memo['id'], config?: { isAvailableOnly?: boolean }) {
    let query = this.db
      .selectFrom(this.tableName)
      .where('id', '=', id)
      .where('type', '=', EntityTypes.Memo)
      .select(['id', 'body', 'parentId', 'details', `${this.tableName}.createdAt`, 'updatedAt']);

    if (config?.isAvailableOnly) {
      query = query
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await query.executeTakeFirst();

    return row ? SqliteMemoRepository.toMemo(row) : null;
  }

  public async findAll(q: MemoQuery) {
    const rows = await this.getQueryListSql(q).execute();
    return rows.map((row) => SqliteMemoRepository.toMemo(row));
  }

  public async queryCount(q?: ClientMemoQuery) {
    const { count } = await this.getQueryListSql(q || {})
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .executeTakeFirstOrThrow();

    return count;
  }

  private getQueryListSql(q: MemoQuery) {
    let query = this.db
      .selectFrom(this.tableName)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.body`,
        `${this.tableName}.parentId`,
        `${this.tableName}.details`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .where(`${this.tableName}.type`, '=', EntityTypes.Memo)
      .distinct(); // 联 topic 表会导致查出同样的记录，需要去重

    if (typeof q.isAvailableOnly === 'boolean') {
      query = query
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, q.isAvailableOnly ? 'is' : 'is not', null);
    }

    if (typeof q.isPinned === 'boolean') {
      query = query.where((eb) => eb(sql`coalesce(json_extract(details, '$.isPinned'), 0)`, '=', q.isPinned ? 1 : 0));
    }

    if (q.durations && q.durations.length > 0) {
      const { durations } = q;
      query = query.where((eb) =>
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
      query = query.where(`${this.tableName}.id`, Array.isArray(q.id) ? 'in' : '=', q.id);
    }

    if (typeof q.parentId !== 'undefined') {
      query = query.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    query = query
      .orderBy(`${this.tableName}.createdAt`, q.order ?? 'desc')
      .orderBy(`${this.tableName}.id`, q.order ?? 'desc');

    if (q.limit) {
      query = query.limit(q.limit);
    }

    return query;
  }
}
