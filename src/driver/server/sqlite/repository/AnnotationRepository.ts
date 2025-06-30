import { keyBy } from 'lodash-es';

import type { AnnotationRepository } from '#domain/server/repository/annotationRepository.js';
import type { Annotation, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { EntityId } from '#domain/shared/model/entity.js';

import BaseRepository from './BaseRepository.js';
import annotationSchema from '../schema/annotation.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as noteTableName } from '../schema/note.js';
import { tableName as fileTableName } from '../schema/file.js';
import ContentService from '#domain/server/service/ContentService/index.js';

export default class SqliteAnnotationRepository extends BaseRepository implements AnnotationRepository {
  protected readonly tableName = annotationSchema.tableName;
  public async findAllTargets(ids: Annotation['id'][]) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .innerJoin(noteTableName, `${noteTableName}.id`, `${this.tableName}.targetId`)
      .innerJoin(fileTableName, `${fileTableName}.id`, `${noteTableName}.fileId`)
      .where(`${this.tableName}.targetId`, 'in', ids)
      .select([
        `${this.tableName}.id as annotationId`,
        `${fileTableName}.id as fileId`,
        `${noteTableName}.id`,
        `${noteTableName}.title`,
        `${noteTableName}.type`,
        `${noteTableName}.icon`,
        `${noteTableName}.parentId`,
        `${noteTableName}.createdAt`,
        `${noteTableName}.updatedAt`,
        `${fileTableName}.mimeType`,
        `${noteTableName}.body`,
        `${noteTableName}.sourceUrl`,
      ])
      .execute();

    return keyBy(rows, (row) => row.annotationId);
  }

  public async create(annotation: Annotation) {
    const bodyPlainText = ContentService.markdownToPlain(annotation.body);
    const created = await this.db
      .insertInto(this.tableName)
      .values({
        ...annotation,
        bodyPlainText,
        selector: JSON.stringify(annotation.selector),
      })
      .returning([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selector`,
        `${this.tableName}.body`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .executeTakeFirstOrThrow();

    return created;
  }

  public async findAllByEntityId(entityId: EntityId, config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('targetId', '=', entityId)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selector`,
        `${this.tableName}.body`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const rows = await sql.execute();
    return rows;
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const updated = await this.db
      .updateTable(this.tableName)
      .set({
        ...patch,
        selector: patch.selector ? JSON.stringify(patch.selector) : undefined,
      })
      .where('id', '=', annotationId)
      .returning([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selector`,
        `${this.tableName}.body`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .executeTakeFirst();

    return Boolean(updated);
  }

  public async findOneById(annotationId: Annotation['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('id', '=', annotationId)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selector`,
        `${this.tableName}.body`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();

    return row || null;
  }
}
