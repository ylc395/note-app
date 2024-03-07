import type { RevisionRepository } from '@domain/service/repository/RevisionRepository.js';

import type { EntityId } from '@domain/model/entity.js';
import type { Revision } from '@domain/model/revision.js';
import BaseRepository from './BaseRepository.js';
import schema from '../schema/revision.js';

const { tableName } = schema;

export default class SqliteRevisionRepository extends BaseRepository implements RevisionRepository {
  async create(revision: Revision) {
    const row = await this.createOneOn(tableName, { ...revision, id: this.generateId() });
    return row;
  }

  async findAllByEntityId(entityId: EntityId) {
    const result = await this.db
      .selectFrom(tableName)
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .select(['id', 'createdAt', 'diff'])
      .execute();

    return result;
  }

  async getLatestRevisionTime(entityId: EntityId) {
    const row = await this.db
      .selectFrom(tableName)
      .select(['createdAt'])
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .executeTakeFirst();

    return row ? row.createdAt : null;
  }
}
