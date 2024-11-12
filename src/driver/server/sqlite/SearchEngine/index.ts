import { type Kysely, sql } from 'kysely';
import { compact } from 'lodash-es';
import { container } from 'tsyringe';
import assert from 'node:assert';

import type { SearchEngine } from '#domain/server/infra/searchEngine.js';
import { token as repositoriesToken } from '#domain/server/repository/index.js';
import { SearchFields, SearchRequest, type SearchResult } from '#domain/shared/model/search.js';

import type SqliteDb from '../Database.js';
import { tableName as recyclablesTableName } from '../schema/recyclable.js';
import { tableName as filesTableName } from '../schema/file.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as materialTableName } from '../schema/material.js';
import {
  type SearchEngineDb,
  initialSqls,
  WRAPPER_START_TEXT,
  WRAPPER_END_TEXT,
  notesFTSTableName,
  materialsFTSTableName,
  memosFTSTableName,
  fileTextsFTSTableName,
} from './tables.js';
import { type EntityId, EntityTypes } from '#domain/shared/model/entity.js';
import { buildIndex } from '#utils/collection.js';

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

    if (this.sqliteDb.hasTable(notesFTSTableName)) {
      return;
    }

    this.sqliteDb.transaction(async () => {
      for (const sql of initialSqls) {
        await sql.execute(this.db);
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
        fn<string>('highlight', [
          sql.raw(notesFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('titleResult'),
        fn<string>('highlight', [
          sql.raw(notesFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .where((eb) => {
        const titleCondition = eb(notesFTSTableName, 'match', `title : ${q.keyword}`);
        const contentCondition = eb(notesFTSTableName, 'match', `body : ${q.keyword}`);

        const fieldsStatements = compact([
          q.fields?.includes(SearchFields.Title) && titleCondition,
          q.fields?.includes(SearchFields.Body) && contentCondition,
        ]);

        return fieldsStatements.length === 0 ? eb(notesFTSTableName, 'match', q.keyword) : eb.or(fieldsStatements);
      })
      .where((eb) => {
        return eb.and(
          compact([
            !q.includingRecyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            ids && ids.length > 0 && eb(`${notesFTSTableName}.id`, 'in', ids),
          ]),
        );
      })
      .execute();

    const searchResult: SearchResult[] = rows.map((row) => ({
      entityId: row.entityId,
      rank: row.rank,
      entityType: EntityTypes.Note as const,
      matches: {
        [SearchFields.Title]: SqliteSearchEngine.parseSearchResult(row.titleResult),
        [SearchFields.Body]: SqliteSearchEngine.parseSearchResult(row.contentResult),
      },
    }));

    return searchResult;
  }

  private async searchMaterials(q: SearchRequest, ids?: EntityId[]) {
    const rows = await this.db
      .selectFrom(materialsFTSTableName)
      .innerJoin(filesTableName, `${materialsFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${materialsFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${materialsFTSTableName}.id as entityId`,
        `${materialsFTSTableName}.rank as rank`,
        `${filesTableName}.id as fileId`,
        fn<string>('highlight', [
          sql.raw(materialsFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('titleResult'),
        fn<string>('highlight', [
          sql.raw(materialsFTSTableName),
          val(2),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .where((eb) => {
        const fieldsStatements = compact([
          q.fields?.includes(SearchFields.Title) && eb(materialsFTSTableName, 'match', `title : ${q.keyword}`),
          q.fields?.includes(SearchFields.Body) && eb(materialsFTSTableName, 'match', `body : ${q.keyword}`),
        ]);

        return fieldsStatements.length === 0 ? eb(materialsFTSTableName, 'match', q.keyword) : eb.or(fieldsStatements);
      })
      .where((eb) => {
        return eb.and(
          compact([
            !q.includingRecyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            ids && ids.length > 0 && eb(`${materialsFTSTableName}.id`, 'in', ids),
          ]),
        );
      })
      .execute();

    const searchResult: SearchResult[] = rows.map((row) => ({
      entityId: row.entityId,
      rank: row.rank,
      entityType: EntityTypes.Memo as const,
      matches: {
        [SearchFields.Title]: SqliteSearchEngine.parseSearchResult(row.titleResult),
        [SearchFields.Body]: SqliteSearchEngine.parseSearchResult(row.contentResult),
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
            !q.includingRecyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
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
      .leftJoin(materialTableName, `${materialTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(linkTableName, `${linkTableName}.target`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, (join) =>
        join.on((eb) =>
          eb.or([
            eb(`${linkTableName}.sourceId`, '=', `${recyclablesTableName}.entityId`),
            eb(`${materialTableName}.id`, '=', `${recyclablesTableName}.entityId`),
          ]),
        ),
      )
      .where((eb) => {
        return eb.and(
          compact([
            eb(fileTextsFTSTableName, 'match', q.keyword),
            !q.includingRecyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            entityIds &&
              entityIds.length > 0 &&
              eb.or([eb(`${materialTableName}.id`, 'in', entityIds), eb(`${linkTableName}.sourceId`, 'in', entityIds)]),
          ]),
        );
      })
      .select(({ fn, val }) => [
        `${materialTableName}.id as materialId`,
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
    const types = q.entityTypes || [EntityTypes.Note, EntityTypes.Memo, EntityTypes.Material];
    const descantIds = q.rootId ? await this.repo.entities.findDescendantIds(q.rootId) : [];
    let results: SearchResult[] = [];

    if (types.includes(EntityTypes.Note)) {
      results.push(...(await this.searchNotes(q, descantIds)));
    }

    if (types.includes(EntityTypes.Memo)) {
      results.push(...(await this.searchMemos(q, descantIds)));
    }

    if (types.includes(EntityTypes.Material)) {
      results.push(...(await this.searchMaterials(q, descantIds)));
    }

    const entityIds = results.map(({ entityId }) => entityId);
    let fileTextResult;

    if (!q.fields || q.fields.includes(SearchFields.File)) {
      fileTextResult = await this.searchFileText(q, descantIds);

      const fileEntityIds = fileTextResult.map(({ entityId, materialId }) => {
        const id = entityId || materialId;
        assert(id, 'no entityId or materialId');
        return id;
      });

      entityIds.push(...fileEntityIds);
    }

    if (fileTextResult) {
      const resultMap = buildIndex(results, 'entityId');

      for (const { materialId, entityId, contentResult, rank } of fileTextResult) {
        const result = (materialId && resultMap[materialId]) || (entityId && resultMap[entityId]);
        const id = materialId || entityId;
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
