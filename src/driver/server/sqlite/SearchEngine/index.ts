import { type Kysely, sql } from 'kysely';
import { compact, keyBy, sortBy } from 'lodash-es';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SearchEngine } from '#domain/server/infra/searchEngine.js';
import { token as repositoriesToken } from '#domain/server/repository/index.js';
import { SearchFields, SearchRequest, type FileMatchRecord, type SearchResult } from '#domain/shared/model/search.js';
import { type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import container from '#utils/singletonContainer.js';

import type SqliteDb from '../Database.js';
import { tableName as recyclablesTableName } from '../schema/recyclable.js';
import { tableName as filesTableName } from '../schema/file.js';
import { tableName as linkTableName } from '../schema/link.js';
import {
  type SearchEngineDb,
  initialSqls,
  WRAPPER_START_TEXT,
  WRAPPER_END_TEXT,
  notesFTSTableName,
  memosFTSTableName,
  fileTextsFTSTableName,
  annotationsFTSTableName,
} from './tables.js';

export default class SqliteSearchEngine implements SearchEngine {
  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.createTables();
  }
  public ready: Promise<void>;

  private get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private readonly repo = container.resolve(repositoriesToken);

  private async createTables() {
    await this.sqliteDb.ready;

    // sqlite 内置的 tokenizer 无法为 CJK 字符或词汇建立索引（只能为一整片连续的 CJK 建立索引）。因此必须使用 simple tokenizer
    const extensionPath = join(dirname(fileURLToPath(import.meta.url)), 'simple-tokenizer');
    this.sqliteDb.rawDb.loadExtension(join(extensionPath, 'libsimple'));

    // 使用 jieba 之后，可为汉语词汇建立索引，从而增加查询速度和准确度
    this.sqliteDb.rawDb.prepare('select jieba_dict(?)').run(join(extensionPath, 'dict'));

    this.sqliteDb.transaction(async () => {
      for (const { tableName, sql } of initialSqls) {
        if (this.sqliteDb.hasTable(tableName)) {
          continue;
        }

        for (const s of sql) {
          await s.execute(this.db);
        }
      }
    });
  }

  private async searchNotes(q: { keyword: string; title: boolean; body: boolean; ids?: EntityId[] }) {
    const rows = await this.db
      .selectFrom(notesFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${notesFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as entityId`,
        'rank',
        fn<string | null>('simple_snippet', [
          sql.raw(notesFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('titleResult'),
        fn<string | null>('simple_snippet', [
          sql.raw(notesFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
      ])
      .where((eb) => {
        if (q.title && q.body) {
          /* simple_query 对传入的关键字做了以下处理：
            1. 如果查数字，我们要把搜索词当作前缀来用，比如用户搜索 123， query 就需要换成 123*，这样如果索引里面有 12345 也能被搜索出来
            2. 对于英文，除了要当作前缀，还需要把搜索词转成小写，比如用户搜索 Hello，query 就需要换成 hello*, 这样如果索引里面有 HelloWorld 也能被命中
            3. 对于中文和其他字符，拆出词汇（jieba 分词）或单字
            4. 最后对于拼音（其实我们没办法区分英文和拼音，统一当作拼音处理就行），需要把拼音按照规则拆分，因为我们的拼音索引是单字建立的。这样如果用户搜索 “zhangliangy”，拼音就可以被拆成 ‘zhang AND liang AND y*’，从而命中"张靓颖"。具体规则微信的文章中也有详述。
          
            来源：https://www.wangfenjin.com/posts/simple-tokenizer/#query-%E6%8B%86%E5%88%86 以及 https://www.wangfenjin.com/posts/simple-jieba-tokenizer/#%E5%AE%9E%E7%8E%B0
          */
          return eb(notesFTSTableName, 'match', eb.fn<string>('jieba_query', [eb.val(q.keyword)]));
        }

        if (q.title) {
          // 这种单列过滤的 hack 写法来自 https://github.com/wangfenjin/simple/issues/139#issuecomment-1833147609
          return eb(notesFTSTableName, 'match', sql<string>`'title : ' || jieba_query(${sql.lit(q.keyword)})`);
        }

        return eb(notesFTSTableName, 'match', sql<string>`'body_plain_text : ' || jieba_query(${sql.lit(q.keyword)})`);
      })
      .where((eb) => {
        return eb.and(
          compact([
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            q.ids && q.ids.length > 0 && eb(`${notesFTSTableName}.id`, 'in', q.ids),
          ]),
        );
      })
      .orderBy((eb) => eb.fn('bm25', [notesFTSTableName, sql.val(1), sql.val(10), sql.val(5)]))
      .execute();

    const searchResult: SearchResult[] = rows.map((row) => ({
      entityId: row.entityId,
      rank: row.rank,
      entityType: EntityTypes.Note as const,
      matches: {
        [SearchFields.Title]: row.titleResult ? SqliteSearchEngine.parseSearchResult(row.titleResult) : undefined,
        [SearchFields.Body]: row.contentResult ? SqliteSearchEngine.parseSearchResult(row.contentResult) : undefined,
      },
    }));

    return searchResult;
  }

  private async searchMemos({ keyword, ids }: { keyword: string; ids?: EntityId[] }) {
    const rows = await this.db
      .selectFrom(memosFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${memosFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${memosFTSTableName}.id as entityId`,
        sql.val('').as('titleResult'),
        `${memosFTSTableName}.rank as rank`,
        fn<string>('simple_snippet', [
          sql.raw(memosFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
      ])
      .where(memosFTSTableName, 'match', keyword)
      .where((eb) => {
        return eb.and(
          compact([
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            ids && ids.length > 0 && eb(`${memosFTSTableName}.id`, 'in', ids),
          ]),
        );
      })
      .execute();

    const searchResult: SearchResult[] = rows.map((row) => ({
      entityId: row.entityId,
      rank: row.rank,
      entityType: EntityTypes.Memo as const,
      matches: {
        [SearchFields.Body]: SqliteSearchEngine.parseSearchResult(row.contentResult),
      },
    }));

    return searchResult;
  }

  private async searchFileText({ keyword, entityIds }: { keyword: string; entityIds?: EntityId[] }) {
    return this.db
      .selectFrom(fileTextsFTSTableName)
      .innerJoin(filesTableName, `${fileTextsFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(notesFTSTableName, `${notesFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(linkTableName, `${linkTableName}.target`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, (join) =>
        join.on((eb) =>
          eb.or([
            eb(`${linkTableName}.sourceId`, '=', `${recyclablesTableName}.entityId`),
            eb(`${notesFTSTableName}.id`, '=', `${recyclablesTableName}.entityId`),
          ]),
        ),
      )
      .where((eb) => {
        return eb.and(
          compact([
            eb.or([eb(`${notesFTSTableName}.fileId`, 'is not', null), eb(`${linkTableName}.target`, 'is not', null)]),
            eb(fileTextsFTSTableName, 'match', keyword),
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            entityIds &&
              entityIds.length > 0 &&
              eb.or([eb(`${notesFTSTableName}.id`, 'in', entityIds), eb(`${linkTableName}.sourceId`, 'in', entityIds)]),
          ]),
        );
      })
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as noteId`,
        `${linkTableName}.sourceId as entityId`,
        `${fileTextsFTSTableName}.rank`,
        `${fileTextsFTSTableName}.fileId`,
        `${fileTextsFTSTableName}.location`,
        fn<string>('simple_snippet', [
          sql.raw(fileTextsFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
      ])
      .execute();
  }

  private async searchAnnotations({ keyword, entityIds }: { keyword: string; entityIds?: EntityId[] }) {
    return this.db
      .selectFrom(annotationsFTSTableName)
      .innerJoin(notesFTSTableName, `${annotationsFTSTableName}.targetId`, `${notesFTSTableName}.id`)
      .leftJoin(recyclablesTableName, (join) =>
        join.on((eb) =>
          eb.or([
            eb(`${annotationsFTSTableName}.id`, '=', `${recyclablesTableName}.entityId`),
            eb(`${annotationsFTSTableName}.targetId`, '=', `${recyclablesTableName}.entityId`),
          ]),
        ),
      )
      .where((eb) => {
        return eb.and(
          compact([
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            eb(annotationsFTSTableName, 'match', keyword),
            entityIds &&
              entityIds.length > 0 &&
              eb.or([
                eb(`${notesFTSTableName}.id`, 'in', entityIds),
                eb(`${annotationsFTSTableName}.targetId`, 'in', entityIds),
              ]),
          ]),
        );
      })
      .select(({ fn, val }) => [
        `${annotationsFTSTableName}.targetId as noteId`,
        `${annotationsFTSTableName}.rank`,
        `${annotationsFTSTableName}.id`,
        `${annotationsFTSTableName}.selector`,
        fn<string>('simple_snippet', [
          sql.raw(annotationsFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
          val('...'),
          val('64'),
        ]).as('contentResult'),
      ])
      .execute();
  }

  public async search(q: Required<SearchRequest>): Promise<SearchResult[]> {
    const descantIds =
      q.rootId.length > 0 ? Object.values(await this.repo.entities.findDescendantIds(q.rootId)).flat() : undefined;

    let results: SearchResult[] = [];

    if (q.entityTypes.includes(EntityTypes.Note)) {
      const noteResult = await this.searchNotes({
        keyword: q.keyword,
        title: q.fields.includes(SearchFields.Title),
        body: q.fields.includes(SearchFields.Body),
        ids: descantIds,
      });

      results.push(...noteResult);
    }

    if (q.entityTypes.includes(EntityTypes.Memo)) {
      const memoResult = await this.searchMemos({ keyword: q.keyword, ids: descantIds });
      results.push(...memoResult);
    }

    const resultMap = keyBy(results, ({ entityId }) => entityId);

    if (q.fields.includes(SearchFields.Annotation)) {
      const annotationResult = await this.searchAnnotations({ keyword: q.keyword, entityIds: descantIds });

      for (const { noteId, contentResult, rank, selector, id } of annotationResult) {
        const result = resultMap[noteId];
        const parsed = SqliteSearchEngine.parseSearchResult(contentResult);

        if (!parsed) {
          continue;
        }

        const record = { ...parsed, id, selector };

        if (result) {
          (result.matches[SearchFields.Annotation] ??= []).push(record);

          if (rank > result.rank) {
            result.rank = rank;
          }
        } else {
          const newResult = {
            entityId: noteId,
            rank,
            matches: { [SearchFields.Annotation]: [record] },
          };
          resultMap[noteId] = newResult;
          results.push(newResult);
        }
      }
    }

    if (q.fields.includes(SearchFields.File)) {
      const fileTextResult = await this.searchFileText({ keyword: q.keyword, entityIds: descantIds });

      for (const { noteId, entityId, contentResult, rank, location } of fileTextResult) {
        const result = (noteId && resultMap[noteId]) || (entityId && resultMap[entityId]);
        const id = noteId || entityId;
        const parsed = SqliteSearchEngine.parseSearchResult(contentResult);

        if (!parsed) {
          continue;
        }

        const fileMatchRecord: FileMatchRecord = {
          ...parsed,
          location,
        };

        if (result) {
          (result.matches[SearchFields.File] ??= []).push(fileMatchRecord);

          if (rank > result.rank) {
            result.rank = rank;
          }
        } else if (id) {
          const newResult = {
            entityId: id,
            rank,
            matches: { [SearchFields.File]: [fileMatchRecord] },
          };
          resultMap[id] = newResult;
          results.push(newResult);
        }
      }
    }

    // todo: rank 值在不同表间没有可比性，这里的排序意义不大
    results = sortBy(Object.values(resultMap), ({ rank }) => rank);
    return results;
  }

  private static parseSearchResult(str: string) {
    const highlights: { start: number; end: number }[] = [];

    let i = 0;
    let index = -1;

    while ((index = str.indexOf(WRAPPER_START_TEXT, index + 1)) > -1) {
      const endIndex = str.indexOf(WRAPPER_END_TEXT, index + 1);

      highlights.push({
        start: index - (WRAPPER_START_TEXT.length + WRAPPER_END_TEXT.length) * i,
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i),
      });

      i += 1;
    }

    if (i === 0) {
      return undefined;
    }

    return {
      text: str.replaceAll(WRAPPER_START_TEXT, '').replaceAll(WRAPPER_END_TEXT, ''),
      highlights,
    };
  }
}
