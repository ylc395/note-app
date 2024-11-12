import type { Selectable } from 'kysely';

import type { AnnotationRepository } from '#domain/server/repository/annotationRepository.js';
import type { Annotation, AnnotationPatchDTO } from '#domain/shared/model/annotation.js';
import type { EntityId } from '#domain/shared/model/entity.js';
import { buildIndex } from '#utils/collection.js';

import BaseRepository from './BaseRepository.js';
import annotationSchema, { type Row } from '../schema/annotation.js';
import { tableName as recyclableTableName } from '../schema/recyclable.js';
import { tableName as materialTableName } from '../schema/material.js';
import { tableName as fileTableName } from '../schema/file.js';

export default class SqliteAnnotationRepository extends BaseRepository implements AnnotationRepository {
  protected readonly tableName = annotationSchema.tableName;
  public async findAllTargets(ids: Annotation['id'][]) {
    const rows = await this.db
      .selectFrom(this.tableName)
      .innerJoin(materialTableName, `${materialTableName}.id`, `${this.tableName}.targetId`)
      .innerJoin(fileTableName, `${fileTableName}.id`, `${materialTableName}.fileId`)
      .where(`${this.tableName}.targetId`, 'in', ids)
      .select([
        `${this.tableName}.id as annotationId`,
        `${fileTableName}.mimeType`,
        `${materialTableName}.id`,
        `${materialTableName}.title`,
        `${materialTableName}.icon`,
        `${materialTableName}.parentId`,
        `${materialTableName}.createdAt`,
        `${materialTableName}.updatedAt`,
        `${materialTableName}.body`,
        `${materialTableName}.sourceUrl`,
      ])
      .execute();

    return buildIndex(rows, 'annotationId');
  }

  public async create(annotation: Annotation) {
    const created = await this.db
      .insertInto(this.tableName)
      .values({
        ...annotation,
        selectors: JSON.stringify(annotation.selectors),
      })
      .returning([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selectors`,
        `${this.tableName}.body`,
        `${this.tableName}.color`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .executeTakeFirstOrThrow();

    return SqliteAnnotationRepository.rowToVO(created);
  }

  public async findAllByEntityId(entityId: EntityId, config?: { isAvailableOnly?: boolean }) {
    let sql = this.db
      .selectFrom(this.tableName)
      .where('targetId', '=', entityId)
      .select([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selectors`,
        `${this.tableName}.body`,
        `${this.tableName}.color`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ]);

    if (config?.isAvailableOnly) {
      sql = sql
        .leftJoin(recyclableTableName, `${recyclableTableName}.entityId`, `${this.tableName}.id`)
        .where(`${recyclableTableName}.entityId`, 'is', null);
    }

    const rows = await sql.execute();
    return rows.map(SqliteAnnotationRepository.rowToVO);
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const updated = await this.db
      .updateTable(this.tableName)
      .set(patch)
      .where('id', '=', annotationId)
      .returning([
        `${this.tableName}.id`,
        `${this.tableName}.targetId`,
        `${this.tableName}.selectors`,
        `${this.tableName}.body`,
        `${this.tableName}.color`,
        `${this.tableName}.createdAt`,
        `${this.tableName}.updatedAt`,
      ])
      .executeTakeFirst();

    return Boolean(updated);
  }

  private static rowToVO(row: Selectable<Row>): Annotation {
    return {
      ...row,
      selectors: JSON.parse(row.selectors),
    };
  }
}
