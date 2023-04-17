import type { RevisionDTO, RevisionRepository } from 'service/repository/RevisionRepository';

import type { EntityLocator } from 'interface/entity';
import BaseRepository from './BaseRepository';
import schema, { type Row } from '../schema/revision';
import type { RevisionVO } from 'interface/revision';

export default class SqliteRevisionRepository extends BaseRepository<Row> implements RevisionRepository {
  protected readonly schema = schema;
  async create(revision: RevisionDTO) {
    const rows = (await this.knex<Row>(this.schema.tableName)
      .insert({ ...revision, entityId: Number(revision.entityId) })
      .returning(this.knex.raw('*'))) as Row[];

    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: String(rows[0]!.id),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      createdAt: rows[0]!.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      diff: rows[0]!.diff,
    };
  }

  async findLatest({ type: entityType, id: entityId }: EntityLocator) {
    const latest = await this.knex<Row>(this.schema.tableName)
      .where({ entityType, entityId: Number(entityId) })
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

    return rows.map((row) => ({ ...row, id: String(row.id) }));
  }
}
