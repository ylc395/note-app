import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import type { Selectable } from 'kysely';

import type { AnnotationDTO, AnnotationPatchDTO, AnnotationVO, MaterialVO } from 'interface/material';

import BaseRepository from './BaseRepository';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation';

const { tableName } = materialAnnotationSchema;

export default class MaterialAnnotationRepository extends BaseRepository {
  async create(materialId: MaterialVO['id'], { type, comment, ...annotation }: AnnotationDTO) {
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
    } as AnnotationVO;
  }

  async findAll(materialId: MaterialVO['id']) {
    const rows = await this.db.selectFrom(tableName).where('materialId', '=', materialId).selectAll().execute();

    return rows.map(MaterialAnnotationRepository.rowToVO);
  }

  async findOneById(id: AnnotationVO['id']) {
    const row = await this.db.selectFrom(tableName).where('id', '=', id).selectAll().executeTakeFirst();

    return row ? MaterialAnnotationRepository.rowToVO(row) : null;
  }

  private static rowToVO(row: Selectable<Row>) {
    return {
      ...pick(row, ['id', 'createdAt', 'updatedAt', 'comment', 'type']),
      ...JSON.parse(row.meta),
    } as AnnotationVO;
  }

  async remove(annotationId: AnnotationVO['id']) {
    const { numDeletedRows } = await this.db.deleteFrom(tableName).where('id', '=', annotationId).executeTakeFirst();

    return numDeletedRows === 1n;
  }

  async update(annotationId: AnnotationVO['id'], { comment, ...attr }: AnnotationPatchDTO) {
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
