import pick from 'lodash/pick';
import type { HighlightDTO, MaterialVO } from 'interface/material';

import BaseRepository from './BaseRepository';
import materialAnnotationSchema, { type Row } from '../schema/materialAnnotation';

export default class FileRepository extends BaseRepository<Row> {
  protected readonly schema = materialAnnotationSchema;

  get tableName() {
    return this.schema.tableName;
  }

  async createHighlight(materialId: MaterialVO['id'], highlight: HighlightDTO) {
    const created = await this._createOrUpdate({
      materialId,
      meta: JSON.stringify(highlight),
    });

    return {
      ...pick(created, ['id', 'createdAt', 'updatedAt']),
      ...highlight,
      comment: null,
      icon: null,
    };
  }

  async findAllHighlights(materialId: MaterialVO['id']) {
    const rows = await this.knex<Row>(this.schema.tableName).where('materialId', materialId);

    return rows.map((row) => ({
      ...pick(row, ['id', 'icon', 'createdAt', 'updatedAt', 'comment']),
      ...(JSON.parse(row.meta) as HighlightDTO),
    }));
  }
}
