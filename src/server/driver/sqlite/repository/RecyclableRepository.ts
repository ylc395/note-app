import map from 'lodash/map';
import type { EntityLocator } from 'model/entity';
import type { RecycleReason, Recyclable } from 'model/recyclables';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/recyclable';

const { tableName } = schema;

export default class SqliteRecyclableRepository extends BaseRepository implements RecyclablesRepository {
  async batchCreate(entities: Recyclable[]) {
    const rows = await this.db
      .insertInto(tableName)
      .values(
        entities.map(({ entityId: id, entityType: type, reason }) => ({ entityId: id, entityType: type, reason })),
      )
      .returning(['entityId', 'entityType', 'deletedAt', 'reason'])
      .execute();

    return rows;
  }

  async batchRemove(entities: EntityLocator[]) {
    await this.db.deleteFrom(tableName).where('entityId', 'in', map(entities, 'entityId')).execute();
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

  async findAllByLocators(entities: EntityLocator[], reason?: RecycleReason) {
    if (entities.length === 0) {
      return [];
    }

    const ids = map(entities, 'entityId');
    const rows = await this.getCommonSql({ reason }).where('entityId', 'in', ids).execute();

    return rows;
  }

  async getHardDeletedRecord({ entityId: entityId, entityType: entityType }: EntityLocator) {
    const row = await this.getCommonSql({ isHard: 1 })
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .executeTakeFirst();

    return row || null;
  }
}
