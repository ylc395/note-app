import { type Kysely, sql } from 'kysely';
import { compact, keyBy } from 'lodash-es';
import assert from 'node:assert';

import type { SearchEngine } from '#domain/server/infra/searchEngine.js';
import { token as repositoriesToken } from '#domain/server/repository/index.js';
import { SearchFields, SearchRequest, type SearchResult } from '#domain/shared/model/search.js';

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
} from './tables.js';
import { type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import container from '#utils/singletonContainer.js';

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

  private async searchNotes(q: SearchRequest, ids?: EntityId[]) {
    const rows = await this.db
      .selectFrom(notesFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${notesFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as entityId`,
        'rank',
        fn<string | null>('highlight', [
          sql.raw(notesFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('titleResult'),
        fn<string | null>('highlight', [
          sql.raw(notesFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .where((eb) => {
        const titleCondition = eb(notesFTSTableName, 'match', `title : ${q.keyword}`);
        const contentCondition = eb(notesFTSTableName, 'match', `body_plain_text : ${q.keyword}`);

        const fieldsStatements = compact([
          q.fields?.includes(SearchFields.Title) && titleCondition,
          q.fields?.includes(SearchFields.Body) && contentCondition,
        ]);

        return fieldsStatements.length === 0
          ? /* simple_query 对传入的关键字做了以下处理：
            1. 如果查数字，我们要把搜索词当作前缀来用，比如用户搜索 123， query 就需要换成 123*，这样如果索引里面有 12345 也能被搜索出来
            2. 对于英文，除了要当作前缀，还需要把搜索词转成小写，比如用护搜索 Hello，query 就需要换成 hello*, 这样如果索引里面有 HelloWorld 也能被命中
            3. 对于中文和其他字符，拆出词汇（jieba 分词）或单字
            4. 最后对于拼音（其实我们没办法区分英文和拼音，统一当作拼音处理就行），需要把拼音按照规则拆分，因为我们的拼音索引是单字建立的。这样如果用户搜索 “zhangliangy”，拼音就可以被拆成 ‘zhang AND liang AND y*’，从而命中"张靓颖"。具体规则微信的文章中也有详述。
          
            来源：https://www.wangfenjin.com/posts/simple-tokenizer/#query-%E6%8B%86%E5%88%86 以及 https://www.wangfenjin.com/posts/simple-jieba-tokenizer/#%E5%AE%9E%E7%8E%B0
          */
            eb(notesFTSTableName, 'match', eb.fn<string>('jieba_query', [eb.val(q.keyword)]))
          : eb.or(fieldsStatements);
      })
      .where((eb) => {
        return eb.and(
          compact([
            eb(`${recyclablesTableName}.entityId`, 'is', null),
            ids && ids.length > 0 && eb(`${notesFTSTableName}.id`, 'in', ids),
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

  private async searchMemos(q: SearchRequest, ids?: EntityId[]) {
    const rows = await this.db
      .selectFrom(memosFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${memosFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${memosFTSTableName}.id as entityId`,
        sql.val('').as('titleResult'),
        `${memosFTSTableName}.rank as rank`,
        fn<string>('highlight', [
          sql.raw(memosFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .where(memosFTSTableName, 'match', q.keyword)
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

  private async searchFileText(q: SearchRequest, entityIds?: EntityId[]) {
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
            eb(fileTextsFTSTableName, 'match', q.keyword),
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
        fn<string>('highlight', [
          sql.raw(fileTextsFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .execute();
  }

  public async search(q: SearchRequest): Promise<SearchResult[]> {
    const types = q.entityTypes || [EntityTypes.Note, EntityTypes.Memo];
    const descantIds = q.rootId ? await this.repo.entities.findDescendantIds(q.rootId) : undefined;
    const fields = q.fields || [SearchFields.Body, SearchFields.Title, SearchFields.File];

    let results: SearchResult[] = [];

    if (types.includes(EntityTypes.Note)) {
      results.push(...(await this.searchNotes(q, descantIds)));
    }

    if (types.includes(EntityTypes.Memo)) {
      results.push(...(await this.searchMemos(q, descantIds)));
    }

    const entityIds = results.map(({ entityId }) => entityId);
    let fileTextResult;

    if (fields.includes(SearchFields.File)) {
      fileTextResult = await this.searchFileText(q, descantIds);

      const fileEntityIds = fileTextResult.map(({ entityId, noteId }) => {
        const id = entityId || noteId;
        assert(id, 'no entityId or materialId');
        return id;
      });

      entityIds.push(...fileEntityIds);
    }

    if (fileTextResult) {
      const resultMap = keyBy(results, ({ entityId }) => entityId);

      for (const { noteId, entityId, contentResult, rank } of fileTextResult) {
        const result = (noteId && resultMap[noteId]) || (entityId && resultMap[entityId]);
        const id = noteId || entityId;
        const parsed = SqliteSearchEngine.parseSearchResult(contentResult);

        if (!parsed) {
          continue;
        }

        if (result) {
          if (!result.matches[SearchFields.File]) {
            result.matches[SearchFields.File] = [];
          }

          result.matches[SearchFields.File].push(parsed);
        } else if (id) {
          resultMap[id] = {
            entityId: id,
            rank,
            matches: {
              [SearchFields.File]: [parsed],
            },
          };
        }
      }

      results = Object.values(resultMap);
    }

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
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i) - 1,
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
