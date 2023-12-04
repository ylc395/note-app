import type { SynchronizationRepository } from '@domain/service/repository/SynchronizationRepository';
import type { EntityLocator } from '@domain/model/entity';

import BaseRepository from './BaseRepository';
import syncEntitySchema from '../schema/syncEntity';

const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';

export default class SqliteSynchronizationRepository extends BaseRepository implements SynchronizationRepository {
  protected readonly schema = syncEntitySchema;
  async getEntitySyncAt({ entityId: entityId, entityType: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(this.schema.tableName)
      .selectAll()
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .executeTakeFirst();

    return row ? row.syncAt : null;
  }

  async getLastFinishedSyncTimestamp() {
    const value = await this.kv.get(LAST_SYNC_TIME_KEY);
    return value ? Number(value) : null;
  }

  async updateLastFinishedSyncTimestamp(time: number) {
    await this.kv.set(LAST_SYNC_TIME_KEY, String(time));
  }

  async updateEntitySyncAt({ entityId, entityType }: EntityLocator, syncAt: number) {
    const row = await this.getEntitySyncAt({ entityId, entityType });

    if (row) {
      await this.db
        .updateTable(this.schema.tableName)
        .set({ syncAt })
        .where('entityId', '=', entityId)
        .where('entityType', '=', entityType);
    } else {
      await this.db.insertInto(this.schema.tableName).values({ syncAt, entityId, entityType });
    }
  }
}
