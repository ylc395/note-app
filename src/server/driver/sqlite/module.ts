import { Module, Global, type OnModuleInit } from '@nestjs/common';

import { token as databaseToken } from 'infra/database';
import { token as searchEngineToken } from 'infra/searchEngine';

import SqliteSearchEngine from './SearchEngine';
import SqliteDb from './Database';

@Global()
@Module({
  providers: [
    SqliteDb,
    SqliteSearchEngine,
    { provide: databaseToken, useExisting: SqliteDb },
    { provide: searchEngineToken, useExisting: SqliteSearchEngine },
  ],
  exports: [databaseToken, searchEngineToken],
})
export default class SqliteModule implements OnModuleInit {
  constructor(private readonly db: SqliteDb, private readonly searchEngine: SqliteSearchEngine) {}

  onModuleInit() {
    return Promise.all([this.db.ready, this.searchEngine.ready]);
  }
}
