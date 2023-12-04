import { Injectable } from '@nestjs/common';
import type { Kysely } from 'kysely';
import intersectionWith from 'lodash/intersectionWith';

import type { SearchEngine } from '@domain/infra/searchEngine';
import { type EntityId, EntityTypes } from '@domain/model/entity';
import type { SearchParams, SearchResult } from '@domain/model/search';

import SqliteDb from '../Database';
import NoteSearchEngine from './NoteSearchEngine';
import MemoSearchEngine from './MemoSearchEngine';
import MaterialSearchEngine from './MaterialSearchEngine';
import { WRAPPER_END_TEXT, WRAPPER_START_TEXT, NOTE_FTS_TABLE, type SearchEngineDb } from './tables';
import { createFtsSql } from './sql';

@Injectable()
export default class SqliteSearchEngine implements SearchEngine {
  readonly ready: Promise<void>;

  constructor(readonly sqliteDb: SqliteDb) {
    this.ready = this.createTables();
  }

  private readonly notes = new NoteSearchEngine(this);
  private readonly memos = new MemoSearchEngine(this);
  private readonly materials = new MaterialSearchEngine(this);

  get db() {
    return this.sqliteDb.getDb() as unknown as Kysely<SearchEngineDb>;
  }

  private async createTables() {
    await this.sqliteDb.ready;

    if (this.sqliteDb.hasTable(NOTE_FTS_TABLE)) {
      return;
    }

    this.sqliteDb.transaction(async () => {
      for (const sql of createFtsSql) {
        await sql.execute(this.db);
      }
    });
  }

  async search(q: SearchParams): Promise<SearchResult[]> {
    let descantIds: EntityId[] | undefined;

    if (q.root) {
      const descants = await this.sqliteDb.getRepository('entities').findDescendantIds([q.root]);
      descantIds = descants[q.root.entityType][q.root.entityId];
    }

    let searchRecords = (
      await Promise.all([this.notes.search(q), this.materials.search(q), this.memos.search(q)])
    ).flat();

    if (descantIds) {
      searchRecords = intersectionWith(searchRecords, descantIds, ({ entityId }, id) => entityId === id);
    }

    const results: Record<string, SearchResult & { rank: number }> = {};

    for (const record of searchRecords) {
      const result =
        results[record.entityId] ||
        ({
          entityId: record.entityId,
          title: { text: record.title, highlights: [] },
          updatedAt: record.updatedAt,
          createdAt: record.createdAt,
          content: [],
          entityType: record.entityType,
          rank: record.rank,
          icon: null,
          ...(record.entityType === EntityTypes.Material ? { mimeType: record.mimeType! } : {}),
        } as SearchResult & { rank: number });

      if (
        result.title.highlights.length === 0 &&
        (record.entityType === EntityTypes.Note || record.entityType === EntityTypes.Material)
      ) {
        result.title = SqliteSearchEngine.extractSnippet(record.title);
      }

      result.rank = Math.max(record.rank, result.rank);
      result.content.push({
        ...SqliteSearchEngine.extractSnippet(record.body),
        ...(record.location && { location: String(record.location) }),
        ...(record.annotationId && { annotationId: record.annotationId }),
      });

      if (!results[record.entityId]) {
        results[record.entityId] = result;
      }
    }

    return (
      Object.values(results)
        .sort((row1, row2) => {
          const title1 = row1.title.highlights.length;
          const title2 = row2.title.highlights.length;

          if (title1 === title2) {
            return row1.rank - row2.rank;
          }

          return title1 - title2;
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ rank, ...row }) => row)
    );
  }

  private static extractSnippet(snippet: string) {
    const highlights: { start: number; end: number }[] = [];

    let i = 0;
    let index = -1;

    while ((index = snippet.indexOf(WRAPPER_START_TEXT, index + 1)) > -1) {
      const endIndex = snippet.indexOf(WRAPPER_END_TEXT, index + 1);

      highlights.push({
        start: index - (WRAPPER_START_TEXT.length + WRAPPER_END_TEXT.length) * i,
        end: endIndex - (WRAPPER_START_TEXT.length * (i + 1) + WRAPPER_END_TEXT.length * i) - 1,
      });

      i += 1;
    }

    return {
      text: snippet.replaceAll(WRAPPER_START_TEXT, '').replaceAll(WRAPPER_END_TEXT, ''),
      highlights,
    };
  }
}
