import type { EntityLocator } from 'interface/entity';
import type { RecycleReason } from 'interface/recyclables';
import type { RecyclablesRepository, Recyclable } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/recyclable';

const { tableName } = schema;

export default class SqliteRecyclableRepository extends BaseRepository implements RecyclablesRepository {
  async batchCreate(entities: Recyclable[]) {
    const rows = await this.db
      .insertInto(tableName)
      .values(entities.map(({ id, type, reason }) => ({ entityId: id, entityType: type, reason })))
      .returning(['entityId', 'entityType', 'deletedAt'])
      .execute();

    return rows;
  }

  private getCommonSql(query?: { isHard?: 0 | 1; reason?: RecycleReason }) {
    let sql = this.db
      .selectFrom(tableName)
      .select(['entityId', 'entityType', 'deletedAt', 'reason'])
      .where('isHard', '=', query?.isHard ? 1 : 0);

    if (query?.reason) {
      sql = sql.where('reason', '=', query.reason);
    }

    return sql;
  }

  async findAll(reason?: RecycleReason) {
    return await this.getCommonSql({ reason }).execute();
  }

  async findAllByLocators(entities: EntityLocator[]) {
    if (entities.length === 0) {
      return [];
    }

    const ids = entities.map(({ id }) => id);
    const rows = await this.getCommonSql().where('entityId', 'in', ids).execute();

    return rows;
  }

  async getHardDeletedRecord({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.getCommonSql({ isHard: 1 })
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .executeTakeFirst();

    return row || null;
  }
}
