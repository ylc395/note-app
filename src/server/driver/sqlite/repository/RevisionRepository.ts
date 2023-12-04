import type { RevisionRepository } from '@domain/service/repository/RevisionRepository';

import type { EntityLocator } from '@domain/model/entity';
import type { Revision } from '@domain/model/revision';
import BaseRepository from './BaseRepository';
import schema from '../schema/revision';

const { tableName } = schema;

export default class SqliteRevisionRepository extends BaseRepository implements RevisionRepository {
  async create(revision: Revision) {
    const { id, createdAt, diff } = await this.createOne(tableName, { ...revision, id: this.generateId() });
    return { id, createdAt, diff };
  }

  async findAll({ entityType, entityId }: EntityLocator) {
    const result = await this.db
      .selectFrom(tableName)
      .where('entityType', '=', entityType)
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .select(['id', 'createdAt', 'diff'])
      .execute();

    return result;
  }

  async getLatestRevisionTime({ entityId, entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(tableName)
      .select(['createdAt'])
      .where('entityType', '=', entityType)
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .executeTakeFirst();

    return row ? row.createdAt : null;
  }
}
