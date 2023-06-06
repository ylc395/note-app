import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';

import type { AnnotationDTO, AnnotationPatchDTO, AnnotationVO, MaterialVO } from 'interface/material';

import BaseRepository from './BaseRepository';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation';

export default class MaterialAnnotationRepository extends BaseRepository<Row> {
  protected readonly schema = materialAnnotationSchema;

  get tableName() {
    return this.schema.tableName;
  }

  async create(materialId: MaterialVO['id'], { type, comment, ...annotation }: AnnotationDTO) {
    const created = await this._createOrUpdate({
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
    const rows = await this.knex<Row>(this.schema.tableName).where('materialId', materialId);

    return rows.map(MaterialAnnotationRepository.rowToVO);
  }

  async findOneById(id: AnnotationVO['id']) {
    const row = await this.knex<Row>(this.schema.tableName).where('id', id).first();

    return row ? MaterialAnnotationRepository.rowToVO(row) : null;
  }

  private static rowToVO(row: Row) {
    return {
      ...pick(row, ['id', 'createdAt', 'updatedAt', 'comment', 'type']),
      ...JSON.parse(row.meta),
    } as AnnotationVO;
  }

  async remove(annotationId: AnnotationVO['id']) {
    const count = await this.knex<Row>(this.tableName).delete().where({ id: annotationId });
    return count === 1;
  }

  async update(annotationId: AnnotationVO['id'], { comment, ...attr }: AnnotationPatchDTO) {
    let newMeta;

    if (!isEmpty(attr)) {
      const row = await this.knex<Row>(this.tableName).where('id', annotationId).first();

      if (!row) {
        return null;
      }

      newMeta = JSON.stringify({ ...JSON.parse(row.meta), ...attr });
    }

    const updated = await this._createOrUpdate({ comment, meta: newMeta }, annotationId);
    return updated ? MaterialAnnotationRepository.rowToVO(updated) : null;
  }
}
