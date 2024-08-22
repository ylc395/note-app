import type { default as SqliteDatabase } from '../Database.js';

export default abstract class BaseRepository {
  constructor(protected readonly sqliteDb: SqliteDatabase) {}
  protected get db() {
    return this.sqliteDb.getDb();
  }
}
