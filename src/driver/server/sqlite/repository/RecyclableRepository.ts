import BaseRepository from './BaseRepository.js';

import schema from '../schema/recyclable.js';
import type { RecyclablesRepository, Query } from '@domain/server/repository/recyclableRepository.js';
import type { EntityId } from '@domain/shared/model/entity.js';
import type { RecyclableRecord } from '@domain/server/model/recyclable.js';

export default class SqliteRevisionRepository extends BaseRepository implements RecyclablesRepository {
  private readonly tableName = schema.tableName;

  public async findAll(q?: Query) {
    let sql = this.db.selectFrom(this.tableName).select(['entityId', 'createdAt']);

    if (q?.entityIds) {
      sql = sql.where('entityId', 'in', q.entityIds);
    }

    const rows = await sql.execute();
    return rows;
  }

  public async findOneByEntityId(entityId: EntityId) {
    const row = await this.db
      .selectFrom(this.tableName)
      .select(['entityId', 'createdAt'])
      .where('entityId', '=', entityId)
      .executeTakeFirst();

    return row ?? null;
  }

  public async batchCreate(records: RecyclableRecord[]) {
    await this.db.insertInto(this.tableName).values(records).execute();
  }

  public async removeByEntityId(entityId: EntityId) {
    await this.db.deleteFrom(this.tableName).where('entityId', '=', entityId).execute();
  }
}
