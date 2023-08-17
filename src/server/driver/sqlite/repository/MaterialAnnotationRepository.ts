import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import type { Selectable } from 'kysely';

import type { NewAnnotationDTO, AnnotationPatchDTO, Annotation, Material } from 'model/material';

import BaseRepository from './BaseRepository';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation';

const { tableName } = materialAnnotationSchema;

export default class MaterialAnnotationRepository extends BaseRepository {
  async create(materialId: Material['id'], { type, comment, ...annotation }: NewAnnotationDTO) {
    const created = await this.createOne(tableName, {
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
    const rows = await this.db.selectFrom(tableName).where('materialId', '=', materialId).selectAll().execute();

    return rows.map(MaterialAnnotationRepository.rowToVO);
  }

  async findOneById(id: Annotation['id']) {
    const row = await this.db.selectFrom(tableName).where('id', '=', id).selectAll().executeTakeFirst();

    return row
      ? { ...MaterialAnnotationRepository.rowToVO(row), materialId: row.materialId, comment: row.comment || null }
      : null;
  }

  private static rowToVO(row: Selectable<Row>) {
    return {
      ...pick(row, ['id', 'createdAt', 'updatedAt', 'comment', 'type']),
      ...JSON.parse(row.meta),
    } as Annotation;
  }

  async remove(annotationId: Annotation['id']) {
    const { numDeletedRows } = await this.db.deleteFrom(tableName).where('id', '=', annotationId).executeTakeFirst();

    return numDeletedRows === 1n;
  }

  async update(annotationId: Annotation['id'], { comment, ...attr }: AnnotationPatchDTO) {
    let newMeta;

    if (!isEmpty(attr)) {
      const row = await this.db.selectFrom(tableName).where('id', '=', annotationId).select('meta').executeTakeFirst();

      if (!row) {
        return null;
      }

      newMeta = JSON.stringify({ ...JSON.parse(row.meta), ...attr });
    }

    const updated = await this.updateOne(tableName, annotationId, { comment, meta: newMeta });
    return updated ? MaterialAnnotationRepository.rowToVO(updated) : null;
  }
}
