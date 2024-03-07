import { sql, type Kysely } from 'kysely';
import { EntityTypes } from '@domain/model/entity.js';

import type { Schemas } from './index.js';
import { tableName as noteTableName } from './note.js';
import { tableName as materialTableName } from './material.js';
import { tableName as annotationTableName } from './annotation.js';
import { tableName as memoTableName } from './memo.js';

export interface Row {
  id: string;
  title: string;
  icon: string | null;
  type: EntityTypes;
  parentId: string;
  content: string;
  createdAt: number;
}

export const tableName = 'entities';

export default {
  tableName,
  builder: (db: Kysely<Schemas>) =>
    db.schema.createView(tableName).as(
      db
        .selectFrom(noteTableName)
        .select([
          'id',
          'icon',
          'title',
          'parentId',
          'body as content',
          sql.val(EntityTypes.Note).as('type'),
          'createdAt',
        ])
        .union(
          db
            .selectFrom(materialTableName)
            .select([
              'id',
              'icon',
              'title',
              'parentId',
              'comment as content',
              sql.val(EntityTypes.Material).as('type'),
              'createdAt',
            ]),
        )
        .union(
          db
            .selectFrom(memoTableName)
            .select([
              'id',
              sql.val(null).as('icon'),
              sql.val('').as('title'),
              'parentId',
              'body as content',
              sql.val(EntityTypes.Memo).as('type'),
              'createdAt',
            ]),
        )
        .union(
          db
            .selectFrom(annotationTableName)
            .select([
              'id',
              sql.val(null).as('icon'),
              sql.val('').as('title'),
              sql.val(null).as('parentId'),
              'body as content',
              sql.val(EntityTypes.Annotation).as('type'),
              'createdAt',
            ]),
        ),
    ),
} as const;
