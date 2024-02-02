import { pick } from 'lodash-es';
import type { Selectable } from 'kysely';

import type { AnnotationRepository } from '@domain/service/repository/AnnotationRepository.js';

import BaseRepository from './BaseRepository.js';
import annotationSchema, { type Row } from '../schema/annotation.js';
import type { Annotation, AnnotationDTO, AnnotationPatchDTO } from '@domain/model/annotation.js';
import type { EntityId } from '@domain/model/entity.js';

export default class SqliteMaterialAnnotationRepository extends BaseRepository implements AnnotationRepository {
  private readonly tableName = annotationSchema.tableName;

  public async create(annotation: AnnotationDTO) {
    const created = await this.createOneOn(this.tableName, {
      id: this.generateId(),
      ...annotation,
      selectors: JSON.stringify(annotation.selectors),
    });

    return SqliteMaterialAnnotationRepository.rowToVO(created);
  }

  public async findAllByEntityId(entityId: EntityId) {
    const rows = await this.db.selectFrom(this.tableName).where('targetId', '=', entityId).selectAll().execute();

    return rows.map(SqliteMaterialAnnotationRepository.rowToVO);
  }

  public async update(annotationId: Annotation['id'], patch: AnnotationPatchDTO) {
    const updated = await this.db
      .updateTable(this.tableName)
      .set({ ...patch, updatedAt: Date.now() })
      .where('id', '=', annotationId)
      .returningAll()
      .executeTakeFirst();

    return updated ? SqliteMaterialAnnotationRepository.rowToVO(updated) : null;
  }

  private static rowToVO(row: Selectable<Row>) {
    return {
      ...pick(row, ['id', 'createdAt', 'updatedAt', 'targetId', 'color', 'body']),
      selectors: JSON.parse(row.selectors),
    } as Annotation;
  }
}
