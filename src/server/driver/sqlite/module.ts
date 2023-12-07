import { Module, Global, type OnModuleInit } from '@nestjs/common';

import { token as databaseToken } from '@domain/infra/database.js';
import { token as searchEngineToken } from '@domain/infra/searchEngine.js';

import SqliteSearchEngine from './SearchEngine/index.js';
import SqliteDb from './Database.js';

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
