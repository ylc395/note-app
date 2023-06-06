import { Module, Global, type OnModuleInit } from '@nestjs/common';

import { token as databaseToken } from 'infra/database';
import { token as searchEngineToken } from 'infra/searchEngine';
import { token as kvDatabaseToken } from 'infra/kvDatabase';

import SqliteSearchEngine from './SearchEngine';
import SqliteKvDb from './KvDatabase';
import SqliteDb from './Database';

@Global()
@Module({
  providers: [
    SqliteDb,
    SqliteKvDb,
    SqliteSearchEngine,
    { provide: kvDatabaseToken, useExisting: SqliteKvDb },
    { provide: databaseToken, useExisting: SqliteDb },
    { provide: searchEngineToken, useExisting: SqliteSearchEngine },
  ],
  exports: [databaseToken, searchEngineToken, kvDatabaseToken],
})
export default class SqliteModule implements OnModuleInit {
  constructor(
    private readonly db: SqliteDb,
    private readonly kvDb: SqliteKvDb,
    private readonly searchEngine: SqliteSearchEngine,
  ) {}
  onModuleInit() {
    return Promise.all([this.db.ready, this.kvDb.ready, this.searchEngine.ready]);
  }
}
