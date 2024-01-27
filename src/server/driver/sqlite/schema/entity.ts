import { sql, type Kysely } from 'kysely';
import type { Schemas } from './index.js';
import { tableName as noteTableName } from './note.js';
import { tableName as materialTableName } from './material.js';
import { tableName as annotationTableName } from './annotation.js';
import { tableName as memoTableName } from './memo.js';

export interface Row {
  id: string;
  title: string;
  parentId: string;
  content: string;
}

export const tableName = 'entities';

export default {
  tableName,
  builder: (db: Kysely<Schemas>) =>
    db.schema.createView(tableName).as(
      db
        .selectFrom(noteTableName)
        .select(['id', 'title', 'parentId', 'body as content'])
        .union(db.selectFrom(materialTableName).select(['id', 'title', 'parentId', 'comment as content']))
        .union(
          db
            .selectFrom(annotationTableName)
            .select(['id', 'body as content', sql.val(null).as('parentId'), sql.val('').as('title')]),
        )
        .union(db.selectFrom(memoTableName).select(['id', sql.val('').as('title'), 'parentId', 'content'])),
    ),
} as const;
