import type { VersionRepository } from '@domain/service/repository/VersionRepository.js';
import type { Selectable } from 'kysely';

import type { EntityId } from '@domain/model/entity.js';
import type { Version } from '@domain/model/version.js';
import BaseRepository from './BaseRepository.js';
import schema, { type Row } from '../schema/version.js';

const { tableName } = schema;

export default class SqliteRevisionRepository extends BaseRepository implements VersionRepository {
  public async create(version: Version) {
    const row = await this.createOneOn(tableName, {
      ...version,
      isAuto: version.isAuto ? 1 : 0,
      id: this.generateId(),
    });

    return SqliteRevisionRepository.rowToVersion(row);
  }

  private static rowToVersion(row: Selectable<Row>): Version {
    return { ...row, isAuto: Boolean(row.isAuto) };
  }

  public async findAllByEntityId(entityId: EntityId) {
    const result = await this.db
      .selectFrom(tableName)
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .selectAll()
      .execute();

    return result.map(SqliteRevisionRepository.rowToVersion);
  }

  public async getLatestRevisionTime(entityId: EntityId) {
    const row = await this.db
      .selectFrom(tableName)
      .select(['createdAt'])
      .where('entityId', '=', entityId)
      .orderBy('createdAt', 'asc')
      .executeTakeFirst();

    return row ? row.createdAt : null;
  }
}
