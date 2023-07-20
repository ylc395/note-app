import type { EntityLocator } from 'interface/entity';
import type { RecyclablesRepository } from 'service/repository/RecyclableRepository';

import BaseRepository from './BaseRepository';
import schema from '../schema/recyclable';

const { tableName } = schema;

export default class SqliteRecyclableRepository extends BaseRepository implements RecyclablesRepository {
  async batchCreate(entities: EntityLocator[]) {
    const rows = await this.db
      .insertInto(tableName)
      .values(entities.map(({ id, type }) => ({ entityId: id, entityType: type })))
      .returning(['entityId', 'entityType', 'deletedAt'])
      .execute();

    return rows;
  }

  async findOneByLocator({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(tableName)
      .select(['entityId', 'entityType', 'deletedAt'])
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .where('isHard', '=', 0)
      .executeTakeFirst();

    return row || null;
  }

  async findAllByLocators(entities: EntityLocator[]) {
    if (entities.length === 0) {
      return [];
    }

    const ids = entities.map(({ id }) => id);
    const rows = await this.db
      .selectFrom(tableName)
      .select(['entityId', 'entityType', 'deletedAt'])
      .where('entityId', 'in', ids)
      .where('isHard', '=', 0)
      .execute();

    return rows;
  }

  async getHardDeletedRecord({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(tableName)
      .selectAll()
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .where('isHard', '=', 0)
      .executeTakeFirst();

    return row ? { id: row.entityId, type: row.entityType, deletedAt: row.deletedAt } : null;
  }
}
