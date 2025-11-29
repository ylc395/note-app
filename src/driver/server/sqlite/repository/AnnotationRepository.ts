import { compact, keyBy, pick } from 'lodash-es';
import z from 'zod';

import type { AnnotationRepository } from '#domain/server/repository/annotationRepository.js';
import ContentService from '#domain/server/service/ContentService/index.js';
import type { Annotation, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import { EntityTypes, type EntityId } from '#domain/shared/model/entity.js';
import { annotationSchema } from '#domain/shared/infra/apiSchema/annotation.js';

import BaseRepository from './BaseRepository.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as noteTableName } from '../schema/note.js';
import { tableName as fileTableName } from '../schema/file.js';

const detailsSchema = z.object({
  selector: annotationSchema.shape.selector,
});

export default class SqliteAnnotationRepository extends BaseRepository implements AnnotationRepository {
  protected readonly tableName = noteTableName;
  public async findAllTargets(ids: Annotation['id'][]) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .innerJoin(fileTableName, `${fileTableName}.id`, `${noteTableName}.fileId`)
      .where(`${this.tableName}.parentId`, 'in', ids)
      .where(`${this.tableName}.type`, '=', EntityTypes.Annotation)
      .select([
        `${this.tableName}.id as annotationId`,
        `${fileTableName}.id as fileId`,
        `${noteTableName}.id`,
        `${noteTableName}.title`,
        `${noteTableName}.icon`,
        `${noteTableName}.parentId`,
        `${noteTableName}.createdAt`,
        `${noteTableName}.updatedAt`,
        `${fileTableName}.mimeType`,
        `${noteTableName}.sourceUrl`,
      ])
      .execute();

    return keyBy(rows, (row) => row.annotationId);
  }

  public async create(annotation: Annotation) {
    const bodyPlainText = ContentService.markdownToPlain(annotation.body);
    await this.db
      .insertInto(this.tableName)
      .values({
        ...pick(annotation, ['body', 'id', 'parentId', 'body', 'createdAt', 'updatedAt']),
        bodyPlainText,
        type: EntityTypes.Annotation,
        details: JSON.stringify({
          selector: annotation.selector,
        }),
      })
      .returning([`id`, 'parentId', 'body', 'createdAt', 'updatedAt', 'details'])
      .executeTakeFirstOrThrow();

    return annotation;
  }

  public async findAllByEntityId(entityId: EntityId, config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('parentId', '=', entityId)
      .where('type', '=', EntityTypes.Annotation)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.parentId`,
        `${this.tableName}.body`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
        `${this.tableName}.details`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const rows = await sql.execute();
    return compact(rows.map(SqliteAnnotationRepository.toAnnotation));
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const bodyPlainText = typeof patch.body === 'string' ? ContentService.markdownToPlain(patch.body) : undefined;
    const updated = await this.db
      .updateTable(this.tableName)
      .set({
        body: patch.body,
        bodyPlainText,
      })
      .where('id', '=', annotationId)
      .where('type', '=', EntityTypes.Annotation)
      .executeTakeFirst();

    return Boolean(updated);
  }

  public async findOneById(annotationId: Annotation['id'], config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('id', '=', annotationId)
      .where('type', '=', EntityTypes.Annotation)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.parentId`,
        `${this.tableName}.body`,
        `${this.tableName}.details`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const row = await sql.executeTakeFirst();
    return SqliteAnnotationRepository.toAnnotation(row);
  }

  private static toAnnotation<T extends { details: unknown; parentId: unknown }>(
    data: T | undefined,
  ): (T & Pick<Annotation, 'parentId' | 'selector'>) | null {
    const details = detailsSchema.safeParse(data?.details).data;
    const parentId = annotationSchema.shape.parentId.safeParse(data?.parentId).data;

    return details && parentId ? { ...data!, parentId, selector: details.selector } : null;
  }
}
