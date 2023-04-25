import BaseRepository from './BaseRepository';
import type { SynchronizationRepository } from 'service/repository/SynchronizationRepository';
import syncEntitySchema, { type Row } from '../schema/syncEntity';
import kvSchema, { type Row as KvRow } from '../schema/kv';
import type { EntityLocator } from 'interface/entity';

const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';

export default class SqliteSynchronizationRepository extends BaseRepository<Row> implements SynchronizationRepository {
  protected readonly schema = syncEntitySchema;
  async getEntitySyncAt({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.knex<Row>(this.schema.tableName).where({ entityId, entityType }).first();

    return row ? row.syncAt : null;
  }

  async getLastFinishedSyncTimestamp() {
    const row = await this.knex<KvRow>(kvSchema.tableName).where('key', LAST_SYNC_TIME_KEY).first();

    return row ? Number(row.value) : null;
  }

  async updateLastFinishedSyncTimestamp() {
    const lastSyncTime = await this.getLastFinishedSyncTimestamp();
    const syncTime = Date.now();

    if (lastSyncTime) {
      await this.knex<KvRow>(kvSchema.tableName)
        .update({ value: String(syncTime) })
        .where('key', LAST_SYNC_TIME_KEY);
    } else {
      await this.knex<KvRow>(kvSchema.tableName).insert({ key: LAST_SYNC_TIME_KEY, value: String(syncTime) });
    }

    return syncTime;
  }

  async getLocalEntities() {
    return [];
  }
}
