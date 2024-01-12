import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { InjectionToken, container } from 'tsyringe';

import { APP_NAME, IS_DEV, IS_TEST } from '@domain/infra/constants.js';
import { Runtime as CommonRuntime, token as runtimeToken } from '@domain/infra/runtime.js';
import { token as databaseToken } from '@domain/infra/database.js';
import { token as kvDatabaseToken } from '@domain/infra/kvDatabase.js';
import { token as searchEngineToken } from '@domain/infra/searchEngine.js';

import SqliteDb from '../sqlite/Database.js';
import SqliteKvDatabase from '../sqlite/KvDatabase.js';
import SqliteSearchEngine from '../sqlite/SearchEngine/index.js';

export const token: InjectionToken<DesktopRuntime> = Symbol('desktop');

export default abstract class DesktopRuntime extends CommonRuntime {
  protected db = new SqliteDb(this.getAppDir());
  protected kv = new SqliteKvDatabase(this.db);
  protected searchEngine = new SqliteSearchEngine(this.db);

  constructor() {
    super();
    container.registerInstance(databaseToken, this.db);
    container.registerInstance(kvDatabaseToken, this.kv);
    container.registerInstance(searchEngineToken, this.searchEngine);
    container.registerInstance(runtimeToken, this);
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

  async getAppToken() {
    return await this.kv.get('app.http.token', randomUUID);
  }

  public async toggleHttpServer(enable: boolean) {
    console.log(enable);
    return null;
  }
}
