import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { hostname } from 'node:os';
import { InjectionToken, container } from 'tsyringe';

import { APP_NAME, IS_DEV, IS_TEST } from '@domain/infra/constants.js';
import { Runtime as CommonRuntime, token as runtimeToken } from '@domain/infra/runtime.js';
import { token as databaseToken, type Database } from '@domain/infra/database.js';
import { token as kvDatabaseToken, type KvDatabase } from '@domain/infra/kvDatabase.js';
import { token as searchEngineToken, type SearchEngine } from '@domain/infra/searchEngine.js';
import { token as loggerToken } from '@domain/infra/logger.js';
import { token as TextExtractorToken } from '@domain/service/FileService/TextExtractor.js';

import SqliteDb from '../sqlite/Database.js';
import SqliteKvDatabase from '../sqlite/KvDatabase.js';
import SqliteSearchEngine from '../sqlite/SearchEngine/index.js';
import TextExtractor from './TextExtractor/index.js';

export const token: InjectionToken<DesktopRuntime> = Symbol('desktop');

export default abstract class DesktopRuntime extends CommonRuntime {
  protected readonly kv: KvDatabase;
  protected readonly db: Database;
  protected readonly searchEngine: SearchEngine;
  constructor() {
    super();
    container.registerInstance(loggerToken, console);

    const db = new SqliteDb(this.getAppDir());
    const kv = new SqliteKvDatabase(db);
    const searchEngine = new SqliteSearchEngine(db);

    container.registerInstance(runtimeToken, this);
    container.registerInstance(databaseToken, db);
    container.registerInstance(kvDatabaseToken, kv);
    container.registerInstance(searchEngineToken, searchEngine);
    container.registerSingleton(TextExtractorToken, TextExtractor);

    this.db = db;
    this.kv = kv;
    this.searchEngine = searchEngine;
  }

  protected abstract whenUIReady(): Promise<void>;

  public async whenReady() {
    await Promise.all([super.whenReady(), this.whenUIReady()]);
  }

  public getAppDir() {
    const dir = IS_DEV ? `${APP_NAME}-dev` : IS_TEST ? `${APP_NAME}-test` : APP_NAME;

    if (process.env.APPDATA) {
      return path.join(process.env.APPDATA, dir);
    }

    return path.join(
      process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share',
      dir,
    );
  }

  public getDeviceName() {
    return hostname();
  }

  async getAppToken() {
    return await this.kv.get('app.http.token', randomUUID);
  }

  public async toggleHttpServer(enable: boolean) {
    console.log(enable);
    return null;
  }
}
