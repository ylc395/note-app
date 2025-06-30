import type { Selectable } from 'kysely';
import { compact, isEmpty } from 'lodash-es';

import { type MemoPatchDTO, type Memo, FileTypes } from '#domain/server/model/memo.js';
import type { MemoRepository, MemoQuery, CountQuery } from '#domain/server/repository/memoRepository.js';
import { LinkTargetType } from '#domain/server/model/content.js';

import schema, { type Row } from '../schema/memo.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as topicTableName } from '../schema/topic.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as fileTableName } from '../schema/file.js';
import BaseRepository from './BaseRepository.js';
import { MimeTypes } from '#domain/shared/model/file.js';
import ContentService from '#domain/server/service/ContentService/index.js';

export default class SqliteMemoRepository extends BaseRepository implements MemoRepository {
  private readonly tableName = schema.tableName;

  public async create(memo: Memo) {
    const bodyPlainText = ContentService.markdownToPlain(memo.body);
    await this.db
      .insertInto(this.tableName)
      .values({ ...memo, bodyPlainText, isPinned: memo.isPinned ? 1 : 0 })
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

    if (q.links && Object.values(q.links).some((list) => !isEmpty(list))) {
      sql = sql
        .innerJoin(linkTableName, `${linkTableName}.sourceId`, `${this.tableName}.id`)
        .leftJoin(fileTableName, (eb) =>
          eb
            .on(`${linkTableName}.targetType`, '=', LinkTargetType.File)
            .onRef(`${linkTableName}.target`, '=', `${fileTableName}.id`),
        )
        .where((eb) =>
          eb.or(
            compact([
              q.links?.domains === 'all' && eb(`${linkTableName}.targetDomain`, 'is not', null),
              q.links?.entityIds === 'all' &&
                eb.and([
                  eb(`${linkTableName}.target`, 'is not', null),
                  eb(`${linkTableName}.targetType`, '=', LinkTargetType.Entity),
                ]),
              q.links?.fileTypes === 'all' && eb(`${fileTableName}.id`, 'is not', null),

              Array.isArray(q.links?.domains) &&
                q.links.domains.length > 0 &&
                eb(`${linkTableName}.targetDomain`, 'in', q.links.domains),

              Array.isArray(q.links?.entityIds) &&
                q.links.entityIds.length > 0 &&
                eb.and([
                  eb(`${linkTableName}.targetType`, '=', LinkTargetType.Entity),
                  eb(`${linkTableName}.target`, 'in', q.links.entityIds),
                ]),

              Array.isArray(q.links?.fileTypes) &&
                q.links.fileTypes.length > 0 &&
                eb.or(
                  q.links.fileTypes.map((fileType) => {
                    switch (fileType) {
                      case FileTypes.Image:
                        return eb(`${fileTableName}.mimeType`, 'like', 'image%');
                      case FileTypes.Video:
                        return eb(`${fileTableName}.mimeType`, 'like', 'video%');
                      case FileTypes.Audio:
                        return eb(`${fileTableName}.mimeType`, 'like', 'audio%');
                      case FileTypes.Pdf:
                        return eb(`${fileTableName}.mimeType`, '=', MimeTypes.PDF);
                      case FileTypes.Other:
                        return eb.and([
                          eb(`${fileTableName}.mimeType`, 'not like', 'image%'),
                          eb(`${fileTableName}.mimeType`, 'not like', 'video%'),
                          eb(`${fileTableName}.mimeType`, 'not like', 'audio%'),
                          eb(`${fileTableName}.mimeType`, '!=', MimeTypes.PDF),
                        ]);
                    }
                  }),
                ),
            ]),
          ),
        );
    }

    if (q.topics && q.topics.length > 0) {
      sql = sql
        .innerJoin(topicTableName, `${topicTableName}.entityId`, `${this.tableName}.id`)
        .where(`${topicTableName}.name`, 'in', q.topics);
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
      sql = sql.where(`${this.tableName}.id`, Array.isArray(q.id) ? 'in' : '=', q.id);
    }

    if (typeof q.parentId !== 'undefined') {
      sql = sql.where('parentId', q.parentId === null ? 'is' : '=', q.parentId);
    }

    if (typeof q.isPinned === 'boolean') {
      sql = sql.where('isPinned', '=', q.isPinned ? 1 : 0);
    }

    if (q.orderBy === 'createdAt') {
      sql = sql.orderBy([
        `${this.tableName}.createdAt ${q.order ?? 'desc'}`,
        `${this.tableName}.id ${q.order ?? 'desc'}`,
      ]);
    }

    if (q.orderBy === 'updatedAt') {
      sql = sql.orderBy([
        `${this.tableName}.updatedAt ${q.order ?? 'desc'}`,
        `${this.tableName}.id ${q.order ?? 'desc'}`,
      ]);
    }

    if (q.limit) {
      sql = sql.limit(q.limit);
    }

    return sql;
  }
}
