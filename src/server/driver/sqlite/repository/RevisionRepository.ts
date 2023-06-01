import type { RevisionDTO, RevisionRepository } from 'service/repository/RevisionRepository';

import type { EntityLocator } from 'interface/entity';
import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/revision';
import type { RevisionVO } from 'interface/revision';

export default class SqliteRevisionRepository extends BaseRepository<Row> implements RevisionRepository {
  protected readonly schema = schema;
  async create(revision: RevisionDTO) {
    const { id, createdAt, diff } = await this._createOrUpdate(revision);
    return { id, createdAt, diff };
  }

  async findLatest({ type: entityType, id: entityId }: EntityLocator) {
    const latest = await this.knex<Row>(this.schema.tableName)
      .where({ entityType, entityId })
      .orderBy([{ column: 'createdAt', order: 'desc' }])
      .first();

    if (!latest) {
      return null;
    }

    return {
      id: String(latest.id),
      createdAt: latest.createdAt,
      diff: latest.diff,
    };
  }

  async findUtil(revisionId: RevisionVO['id']) {
    const row = await this.knex<Row>(this.schema.tableName).where('id', revisionId).first();

    if (!row) {
      return [];
    }

    const rows = await this.knex<Row>(this.schema.tableName)
      .where({ entityId: row.entityId, entityType: row.entityType })
      .andWhere('createdAt', '<=', row.createdAt)
      .select(['id', 'createdAt', 'diff'])
      .orderBy([{ column: 'createdAt', order: 'asc' }]);

    return rows;
  }
}
