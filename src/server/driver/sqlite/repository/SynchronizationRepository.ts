import BaseRepository from './BaseRepository';
import type { SynchronizationRepository } from 'service/repository/SynchronizationRepository';
import syncEntitySchema, { type Row } from '../schema/syncEntity';
import { load, set } from 'shared/driver/sqlite/kv';
import type { EntityLocator } from 'interface/entity';

const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';

export default class SqliteSynchronizationRepository extends BaseRepository<Row> implements SynchronizationRepository {
  protected readonly schema = syncEntitySchema;
  async getEntitySyncAt({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.knex<Row>(this.schema.tableName).where({ entityId, entityType }).first();

    return row ? row.syncAt : null;
  }

  async getLastFinishedSyncTimestamp() {
    const value = await load(LAST_SYNC_TIME_KEY);
    return value ? Number(value) : null;
  }

  async updateLastFinishedSyncTimestamp() {
    const syncTime = Date.now();
    await set(LAST_SYNC_TIME_KEY, String(syncTime));

    return syncTime;
  }

  async getLocalEntities() {
    return [];
  }
}
