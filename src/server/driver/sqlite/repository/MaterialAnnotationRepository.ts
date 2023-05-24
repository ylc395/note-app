import pick from 'lodash/pick';
import type { AnnotationDTO, AnnotationVO, MaterialVO } from 'interface/material';

import BaseRepository from './BaseRepository';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation';

export default class MaterialAnnotationRepository extends BaseRepository<Row> {
  protected readonly schema = materialAnnotationSchema;

  get tableName() {
    return this.schema.tableName;
  }

  async create(materialId: MaterialVO['id'], { type, annotation, comment }: AnnotationDTO) {
    const created = await this._createOrUpdate({
      materialId,
      type,
      comment,
      meta: JSON.stringify(annotation),
    });

    return {
      ...pick(created, ['id', 'createdAt', 'updatedAt', 'type', 'comment']),
      annotation,
    } as AnnotationVO;
  }

  async findAll(materialId: MaterialVO['id']) {
    const rows = await this.knex<Row>(this.schema.tableName).where('materialId', materialId);

    return rows.map(
      (row) =>
        ({
          ...pick(row, ['id', 'createdAt', 'updatedAt', 'comment', 'type']),
          annotation: JSON.parse(row.meta),
        } as AnnotationVO),
    );
  }
}
