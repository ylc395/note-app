import { Inject } from '@nestjs/common';
import type { SynchronizationRepository } from 'service/repository/SynchronizationRepository';
import type { EntityLocator } from 'interface/entity';
import { token as kvDatabaseToken, type KvDatabase } from 'infra/kvDatabase';

import BaseRepository from './BaseRepository';
import syncEntitySchema from '../schema/syncEntity';

const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';

export default class SqliteSynchronizationRepository extends BaseRepository implements SynchronizationRepository {
  protected readonly schema = syncEntitySchema;
  @Inject(kvDatabaseToken) private readonly kvDb!: KvDatabase;
  async getEntitySyncAt({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.db
      .selectFrom(this.schema.tableName)
      .selectAll()
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .executeTakeFirst();

    return row ? row.syncAt : null;
  }

  async getLastFinishedSyncTimestamp() {
    const value = await this.kvDb.get(LAST_SYNC_TIME_KEY);
    return value ? Number(value) : null;
  }

  async updateLastFinishedSyncTimestamp(time: number) {
    await this.kvDb.set(LAST_SYNC_TIME_KEY, String(time));
  }

  async updateEntitySyncAt({ id: entityId, type: entityType }: EntityLocator, syncAt: number) {
    const row = await this.getEntitySyncAt({ id: entityId, type: entityType });

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
