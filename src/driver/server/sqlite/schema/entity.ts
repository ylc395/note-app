import { sql, type Kysely } from 'kysely';
import { EntityTypes, type Icon } from '#domain/shared/model/entity.js';

import type { Schemas } from './index.js';
import { tableName as noteTableName } from './note.js';
import { tableName as annotationTableName } from './annotation.js';
import { tableName as memoTableName } from './memo.js';

export interface Row {
  id: string;
  title: string;
  icon: Icon | null;
  type: EntityTypes;
  parentId: string;
  body: string;
  createdAt: number;
  updatedAt: number;
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
          'body',
          sql.val(EntityTypes.Note).as('type'),
          'createdAt',
          'updatedAt',
        ])
        .union(
          db
            .selectFrom(memoTableName)
            .select([
              'id',
              sql.val(null).as('icon'),
              'bodyPlainText as title',
              'parentId',
              'body',
              sql.val(EntityTypes.Memo).as('type'),
              'createdAt',
              'updatedAt',
            ]),
        )
        .union(
          db
            .selectFrom(annotationTableName)
            .select([
              'id',
              sql.val(null).as('icon'),
              'bodyPlainText as title',
              'targetId as parentId',
              'body',
              sql.val(EntityTypes.Annotation).as('type'),
              'createdAt',
              'updatedAt',
            ]),
        ),
    ),
} as const;
