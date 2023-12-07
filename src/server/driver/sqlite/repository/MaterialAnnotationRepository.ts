import { pick, isEmpty } from 'lodash-es';
import type { Selectable } from 'kysely';

import type { NewAnnotationDTO, AnnotationPatchDTO, Annotation, Material } from '@domain/model/material.js';

import BaseRepository from './BaseRepository.js';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation.js';

export default class MaterialAnnotationRepository extends BaseRepository {
  readonly tableName = materialAnnotationSchema.tableName;
  async create(materialId: Material['id'], { type, comment, ...annotation }: NewAnnotationDTO) {
    const created = await this.createOne(this.tableName, {
      id: this.generateId(),
      materialId,
      type,
      comment,
      meta: JSON.stringify(annotation),
    });

    return {
      ...pick(created, ['id', 'createdAt', 'updatedAt', 'type', 'comment']),
      ...annotation,
    } as Annotation;
  }

  async findAll(materialId: Material['id']) {
    const rows = await this.db.selectFrom(this.tableName).where('materialId', '=', materialId).selectAll().execute();

    return rows.map(MaterialAnnotationRepository.rowToVO);
  }

  async findOneById(id: Annotation['id']) {
    const row = await this.db.selectFrom(this.tableName).where('id', '=', id).selectAll().executeTakeFirst();

    return row ? MaterialAnnotationRepository.rowToVO(row) : null;
  }

  private static rowToVO(row: Selectable<Row>) {
    return {
      ...pick(row, ['id', 'createdAt', 'updatedAt', 'comment', 'type']),
      ...JSON.parse(row.meta),
    } as Annotation;
  }

  async remove(annotationId: Annotation['id']) {
    const row = await this.db
      .deleteFrom(this.tableName)
      .where('id', '=', annotationId)
      .returningAll()
      .executeTakeFirst();

    return row ? MaterialAnnotationRepository.rowToVO(row) : null;
  }

  async update(annotationId: Annotation['id'], { comment, ...attr }: AnnotationPatchDTO) {
    let newMeta;

    if (!isEmpty(attr)) {
      const row = await this.db
        .selectFrom(this.tableName)
        .where('id', '=', annotationId)
        .select('meta')
        .executeTakeFirst();

      if (!row) {
        return null;
      }

      newMeta = JSON.stringify({ ...JSON.parse(row.meta), ...attr });
    }

    const updated = await this.db
      .updateTable(this.tableName)
      .set({ comment, meta: newMeta, updatedAt: Date.now() })
      .where('id', '=', annotationId)
      .returningAll()
      .executeTakeFirst();

    return updated ? MaterialAnnotationRepository.rowToVO(updated) : null;
  }
}
