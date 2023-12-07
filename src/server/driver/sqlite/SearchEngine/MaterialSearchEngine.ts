import { sql } from 'kysely';

import { type SearchParams, Scopes } from '@domain/model/search.js';
import { normalizeEntityTitle } from '@domain/model/material.js';
import { EntityTypes } from '@domain/model/entity.js';

import type SearchEngine from './index.js';
import {
  FILE_TEXTS_FTS_TABLE,
  MATERIAL_FTS_TABLE,
  MATERIAL_ANNOTATION_FTS_TABLE,
  WRAPPER_END_TEXT,
  WRAPPER_START_TEXT,
  type SearchRow,
} from './tables.js';
import { commonSql } from './sql.js';
import { tableName as fileTableName } from '../schema/file.js';
import { tableName as materialTable } from '../schema/material.js';
import { tableName as linkTableName } from '../schema/link.js';
import { tableName as materialAnnotationTableName } from '../schema/materialAnnotation.js';

export default class SqliteMaterialSearchEngine {
  constructor(private readonly engine: SearchEngine) {}

  async search(q: SearchParams) {
    if (!this.engine.db) {
      throw new Error('no db');
    }

    const scopes = q.scopes || [
      Scopes.MaterialAnnotation,
      Scopes.MaterialAnnotationFile,
      Scopes.MaterialContent,
      Scopes.MaterialTitle,
    ];

    let result: SearchRow[] = [];

    // sqlite doesn't support `or` operator for FTS tables
    // so we have to use multiple sql query
    // see https://sqlite.org/forum/forumpost/f9bb0db67d?t=h&hist
    if (scopes.includes(Scopes.MaterialTitle) || scopes.includes(Scopes.MaterialComment)) {
      let query = this.engine.db
        .selectFrom(MATERIAL_FTS_TABLE)
        .innerJoin(fileTableName, `${fileTableName}.id`, `${MATERIAL_FTS_TABLE}.fileId`)
        .select([
          // prettier-ignore
          sql<string>`simple_snippet(${sql.raw(MATERIAL_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('title'),
          // prettier-ignore
          sql<string>`simple_snippet(${sql.raw(MATERIAL_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          `${MATERIAL_FTS_TABLE}.id as entityId`,
          `${MATERIAL_FTS_TABLE}.rank`,
          `${MATERIAL_FTS_TABLE}.createdAt`,
          `${MATERIAL_FTS_TABLE}.userUpdatedAt as updatedAt`,
          `${fileTableName}.mimeType`,
        ])
        .where((eb) => {
          if (scopes.includes(Scopes.MaterialComment) && scopes.includes(Scopes.MaterialTitle)) {
            return eb(MATERIAL_FTS_TABLE, 'match', q.keyword);
          }

          return scopes.includes(Scopes.MaterialComment)
            ? eb(`${MATERIAL_FTS_TABLE}.comment`, 'match', q.keyword)
            : eb(`${MATERIAL_FTS_TABLE}.title`, 'match', q.keyword);
        })
        .groupBy(`${MATERIAL_FTS_TABLE}.id`);

      query = commonSql(query, MATERIAL_FTS_TABLE, q);
      result = await query.execute();
    }

    if (scopes.includes(Scopes.MaterialContent)) {
      let query = this.engine.db
        .selectFrom(FILE_TEXTS_FTS_TABLE)
        .innerJoin(materialTable, `${materialTable}.fileId`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
        .innerJoin(fileTableName, `${fileTableName}.id`, `${FILE_TEXTS_FTS_TABLE}.fileId`)
        .select([
          // prettier-ignore
          sql<string>`simple_snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          `${materialTable}.id as entityId`,
          `${materialTable}.createdAt`,
          `${materialTable}.userUpdatedAt as updatedAt`,
          `${materialTable}.title`,
          `${fileTableName}.mimeType`,
          `${FILE_TEXTS_FTS_TABLE}.rank`,
          `${FILE_TEXTS_FTS_TABLE}.page as location`,
        ])
        .where(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', q.keyword);

      query = commonSql(query, materialTable, q);
      result = result.concat(await query.execute());
    }

    if (scopes.includes(Scopes.MaterialAnnotation)) {
      let query = this.engine.db
        .selectFrom(MATERIAL_ANNOTATION_FTS_TABLE)
        .innerJoin(materialTable, `${MATERIAL_ANNOTATION_FTS_TABLE}.materialId`, `${materialTable}.id`)
        .innerJoin(fileTableName, `${fileTableName}.id`, `${materialTable}.fileId`)
        .select([
          // prettier-ignore
          sql<string>`simple_snippet(${sql.table(MATERIAL_ANNOTATION_FTS_TABLE)}, 1, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          `${materialTable}.id as entityId`,
          `${materialTable}.createdAt`,
          `${materialTable}.userUpdatedAt as updatedAt`,
          `${materialTable}.title`,
          `${fileTableName}.mimeType`,
          `${MATERIAL_ANNOTATION_FTS_TABLE}.rank`,
          `${MATERIAL_ANNOTATION_FTS_TABLE}.id as annotationId`,
        ])
        .where(`${MATERIAL_ANNOTATION_FTS_TABLE}.comment`, 'match', q.keyword);

      query = commonSql(query, MATERIAL_ANNOTATION_FTS_TABLE, q);
      result = result.concat(await query.execute());
    }

    if (scopes.includes(Scopes.MaterialAnnotationFile)) {
      let query = this.engine.db
        .selectFrom(FILE_TEXTS_FTS_TABLE)
        .innerJoin(linkTableName, `${FILE_TEXTS_FTS_TABLE}.fileId`, `${linkTableName}.toEntityId`)
        .innerJoin(fileTableName, `${fileTableName}.id`, `${linkTableName}.toEntityId`)
        .innerJoin(materialAnnotationTableName, `${materialAnnotationTableName}.id`, `${linkTableName}.fromEntityId`)
        .select([
          // prettier-ignore
          sql<string>`snippet(${sql.raw(FILE_TEXTS_FTS_TABLE)}, 2, '${sql.raw(WRAPPER_START_TEXT)}', '${sql.raw(WRAPPER_END_TEXT)}', '...',  100)`.as('body'),
          sql<string>`'untitled'`.as('title'),
          `${materialAnnotationTableName}.id as entityId`,
          `${materialAnnotationTableName}.createdAt`,
          `${materialAnnotationTableName}.updatedAt`,
          `${FILE_TEXTS_FTS_TABLE}.rank`,
          `${fileTableName}.mimeType`,
          `${FILE_TEXTS_FTS_TABLE}.page as location`,
        ])
        .where(`${FILE_TEXTS_FTS_TABLE}.text`, 'match', q.keyword);

      query = commonSql(query, materialAnnotationTableName, q);
      result = result.concat(await query.execute());
    }

    return result.map((row) => ({
      ...row,
      entityType: EntityTypes.Material as const,
      title: normalizeEntityTitle(row),
    }));
  }
}
