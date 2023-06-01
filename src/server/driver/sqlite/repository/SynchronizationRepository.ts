import BaseRepository from './BaseRepository';
import type { SynchronizationRepository } from 'service/repository/SynchronizationRepository';
import syncEntitySchema, { type Row } from '../schema/syncEntity';
import { kvDbFactory } from '../index';
import type { EntityLocator } from 'interface/entity';

const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';

export default class SqliteSynchronizationRepository extends BaseRepository<Row> implements SynchronizationRepository {
  protected readonly schema = syncEntitySchema;
  private readonly kvDb = kvDbFactory();
  async getEntitySyncAt({ id: entityId, type: entityType }: EntityLocator) {
    const row = await this.knex<Row>(this.schema.tableName).where({ entityId, entityType }).first();

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
      await this.knex<Row>(this.schema.tableName).update({ syncAt }).where({ entityId, entityType });
    } else {
      await this.knex<Row>(this.schema.tableName).insert({ syncAt, entityId, entityType });
    }
  }
}
