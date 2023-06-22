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
    const result = await this.db
      .selectFrom(this.schema.tableName)
      .where('entityType', '=', entityType)
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'desc')
      .select(['id', 'createdAt', 'diff'])
      .executeTakeFirst();

    return result || null;
  }

  async findUtil(revisionId: RevisionVO['id']) {
    const row = await this.db
      .selectFrom(this.schema.tableName)
      .where('id', '=', revisionId)
      .selectAll()
      .executeTakeFirst();

    if (!row) {
      return [];
    }

    const rows = await this.db
      .selectFrom(this.schema.tableName)
      .where('entityType', '=', row.entityType)
      .where('entityId', '=', row.entityId)
      .where('createdAt', '<=', row.createdAt)
      .select(['id', 'createdAt', 'diff'])
      .orderBy('createdAt', 'asc')
      .execute();

    return rows;
  }
}
