import { type Kysely, sql } from 'kysely';
import { compact, groupBy, omit, pick, unionBy } from 'lodash-es';
import assert from 'assert';

import type { SearchEngine } from '@domain/infra/searchEngine.js';
import { SearchFields, type SearchParams, type SearchResult } from '@domain/model/search.js';

import type SqliteDb from '../Database.js';
import { tableName as recyclablesTableName } from '../schema/recyclable.js';
import { tableName as filesTableName } from '../schema/file.js';
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
import { type EntityId, EntityTypes } from '@domain/model/entity.js';

export default class SqliteSearchEngine implements SearchEngine {
  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.createTables();
  }
  public ready: Promise<void>;

  private get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

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

  private async searchNotes(q: SearchParams, descantIds?: EntityId[]) {
    return this.db
      .selectFrom(notesFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${notesFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${notesFTSTableName}.id as entityId`,
        `${notesFTSTableName}.updatedAt`,
        `${notesFTSTableName}.createdAt`,
        `${notesFTSTableName}.icon`,
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
          q.fields?.includes(SearchFields.Content) && contentCondition,
        ]);

        return fieldsStatements.length === 0 ? eb(notesFTSTableName, 'match', q.keyword) : eb.or(fieldsStatements);
      })
      .where((eb) => {
        return eb.and(
          compact([
            !q.recyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            descantIds && descantIds.length > 0 && eb(`${notesFTSTableName}.id`, 'in', descantIds),
            q.updated?.after && eb(`${notesFTSTableName}.updatedAt`, '>=', q.updated.after),
            q.updated?.before && eb(`${notesFTSTableName}.updatedAt`, '<', q.updated.before),
            q.created?.before && eb(`${notesFTSTableName}.createdAt`, '>=', q.created.before),
            q.created?.before && eb(`${notesFTSTableName}.createdAt`, '<', q.created.before),
          ]),
        );
      })
      .execute();
  }

  private searchMaterials(q: SearchParams, descantIds?: EntityId[]) {
    return this.db
      .selectFrom(materialsFTSTableName)
      .innerJoin(filesTableName, `${materialsFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${materialsFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${materialsFTSTableName}.id as entityId`,
        `${materialsFTSTableName}.updatedAt`,
        `${materialsFTSTableName}.createdAt`,
        `${materialsFTSTableName}.icon`,
        'mimeType',
        `${materialsFTSTableName}.rank as rank`,
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
          q.fields?.includes(SearchFields.Content) && eb(materialsFTSTableName, 'match', `comment : ${q.keyword}`),
        ]);

        return fieldsStatements.length === 0 ? eb(materialsFTSTableName, 'match', q.keyword) : eb.or(fieldsStatements);
      })
      .where((eb) => {
        return eb.and(
          compact([
            !q.recyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            descantIds && descantIds.length > 0 && eb(`${materialsFTSTableName}.id`, 'in', descantIds),
            q.updated?.after && eb(`${materialsFTSTableName}.updatedAt`, '>=', q.updated.after),
            q.updated?.before && eb(`${materialsFTSTableName}.updatedAt`, '<', q.updated.before),
            q.created?.before && eb(`${materialsFTSTableName}.createdAt`, '>=', q.created.before),
            q.created?.before && eb(`${materialsFTSTableName}.createdAt`, '<', q.created.before),
          ]),
        );
      })
      .execute();
  }

  private searchMaterialFiles(q: SearchParams, descantIds?: EntityId[]) {
    return this.db
      .selectFrom(fileTextsFTSTableName)
      .innerJoin(filesTableName, `${fileTextsFTSTableName}.fileId`, `${filesTableName}.id`)
      .innerJoin(materialsFTSTableName, `${materialsFTSTableName}.fileId`, `${filesTableName}.id`)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${materialsFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${materialsFTSTableName}.id as entityId`,
        `${materialsFTSTableName}.updatedAt`,
        `${materialsFTSTableName}.createdAt`,
        `${materialsFTSTableName}.icon`,
        'mimeType',
        `${fileTextsFTSTableName}.rank`,
        sql.val('').as('titleResult'),
        fn<string>('highlight', [
          sql.raw(fileTextsFTSTableName),
          val(1),
          val(WRAPPER_START_TEXT),
          val(WRAPPER_END_TEXT),
        ]).as('contentResult'),
      ])
      .where(fileTextsFTSTableName, 'match', q.keyword)
      .where((eb) => {
        return eb.and(
          compact([
            !q.recyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            descantIds && descantIds.length > 0 && eb(`${materialsFTSTableName}.id`, 'in', descantIds),
            q.updated?.after && eb(`${materialsFTSTableName}.updatedAt`, '>=', q.updated.after),
            q.updated?.before && eb(`${materialsFTSTableName}.updatedAt`, '<', q.updated.before),
            q.created?.before && eb(`${materialsFTSTableName}.createdAt`, '>=', q.created.before),
            q.created?.before && eb(`${materialsFTSTableName}.createdAt`, '<', q.created.before),
          ]),
        );
      })
      .execute();
  }

  private searchMemos(q: SearchParams, descantIds?: EntityId[]) {
    return this.db
      .selectFrom(memosFTSTableName)
      .leftJoin(recyclablesTableName, `${recyclablesTableName}.entityId`, `${memosFTSTableName}.id`)
      .select(({ fn, val }) => [
        `${memosFTSTableName}.id as entityId`,
        `${memosFTSTableName}.updatedAt`,
        `${memosFTSTableName}.createdAt`,
        sql.val(null).as('icon'),
        sql.val('').as('titleResult'),
        'rank',
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
            !q.recyclables && eb(`${recyclablesTableName}.entityId`, 'is', null),
            descantIds && descantIds.length > 0 && eb(`${memosFTSTableName}.id`, 'in', descantIds),
            q.updated?.after && eb(`${memosFTSTableName}.updatedAt`, '>=', q.updated.after),
            q.updated?.before && eb(`${memosFTSTableName}.updatedAt`, '<', q.updated.before),
            q.created?.before && eb(`${memosFTSTableName}.createdAt`, '>=', q.created.before),
            q.created?.before && eb(`${memosFTSTableName}.createdAt`, '<', q.created.before),
          ]),
        );
      })
      .execute();
  }

  public async search(q: SearchParams): Promise<SearchResult[]> {
    const types = q.types || [EntityTypes.Note, EntityTypes.Memo, EntityTypes.Material];
    const descantIds = q.root
      ? (await this.sqliteDb.getRepository('entities').findDescendantIds([q.root]))[q.root]
      : [];

    const results: (SearchResult & { rank: number })[] = [];

    if (types.includes(EntityTypes.Note)) {
      const rows = await this.searchNotes(q, descantIds);
      const searchResult = rows.map((row) => ({
        ...pick(row, ['icon', 'entityId', 'createdAt', 'updatedAt', 'rank']),
        entityType: EntityTypes.Note as const,
        matches: {
          [SearchFields.Title]: SqliteSearchEngine.parseSearchResult(row.titleResult),
          [SearchFields.Content]: SqliteSearchEngine.parseSearchResult(row.contentResult),
        },
      }));

      results.push(...searchResult);
    }

    if (types.includes(EntityTypes.Memo)) {
      const rows = await this.searchMemos(q, descantIds);
      const searchResult = rows.map((row) => ({
        ...pick(row, ['icon', 'entityId', 'createdAt', 'updatedAt', 'rank']),
        entityType: EntityTypes.Memo as const,
        matches: {
          [SearchFields.Content]: SqliteSearchEngine.parseSearchResult(row.contentResult),
        },
      }));

      results.push(...searchResult);
    }

    if (types.includes(EntityTypes.Material)) {
      const [materialRows, fileTextRows] = await Promise.all([
        this.searchMaterials(q, descantIds),
        this.searchMaterialFiles(q, descantIds).then((rows) => rows.map((row) => ({ ...row, isFileContent: true }))),
      ]);

      const fileTextsMap = groupBy(fileTextRows, 'entityId');
      const searchResult = unionBy(materialRows, fileTextRows, 'entityId').map((row) => ({
        ...pick(row, ['icon', 'entityId', 'createdAt', 'updatedAt', 'mimeType', 'rank']),
        entityType: EntityTypes.Material as const,
        matches: {
          [SearchFields.Title]: SqliteSearchEngine.parseSearchResult(row.titleResult),
          [SearchFields.Content]:
            'isFileContent' in row ? undefined : SqliteSearchEngine.parseSearchResult(row.contentResult),
          [SearchFields.MaterialFile]: fileTextsMap[row.entityId]?.map((row) => {
            const result = SqliteSearchEngine.parseSearchResult(row.contentResult);
            assert(result);

            return result;
          }),
        },
      }));

      results.push(...searchResult);
    }

    results.sort((result1, result2) => result1.rank - result2.rank);

    return results.map((result) => omit(result, ['rank']));
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
