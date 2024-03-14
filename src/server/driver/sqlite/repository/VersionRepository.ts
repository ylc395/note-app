import type { VersionRepository } from '@domain/service/repository/VersionRepository.js';
import type { Selectable } from 'kysely';

import type { EntityId } from '@domain/model/entity.js';
import type { IndexRange, Version } from '@domain/model/version.js';
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

  public async remove(entityId: EntityId, range: IndexRange) {
    await this.db
      .deleteFrom(tableName)
      .where((eb) =>
        eb.and([eb('entityId', '=', entityId), eb('index', '>=', range.startIndex), eb('index', '<=', range.endIndex)]),
      );
  }

  public async findAllByEntityId(entityId: EntityId, index?: number) {
    let sql = this.db.selectFrom(tableName).where('entityId', '=', entityId);

    if (index) {
      sql = sql.where('index', '<=', index);
    }

    const result = await sql.orderBy('createdAt', 'asc').selectAll().execute();
    return result.map(SqliteRevisionRepository.rowToVersion);
  }

  public async findLatest(entityId: EntityId) {
    const row = await this.db
      .selectFrom(tableName)
      .selectAll()
      .where('entityId', '=', entityId)
      .orderBy('index', 'desc')
      .executeTakeFirst();

    return row ? SqliteRevisionRepository.rowToVersion(row) : null;
  }
}
