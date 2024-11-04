import path from 'node:path';
import { hostname } from 'node:os';
import { container } from 'tsyringe';

import { APP_NAME, IS_DEV, IS_TEST } from '@domain/shared/infra/constants.js';
import { Runtime, token as runtimeToken } from '@domain/server/infra/runtime.js';
import { token as databaseToken } from '@domain/server/infra/database.js';
import { token as kvDatabaseToken } from '@domain/server/infra/kvDatabase.js';
import { token as searchEngineToken } from '@domain/server/infra/searchEngine.js';
import { token as repositoriesToken } from '@domain/server/repository/index.js';
import { token as loggerToken } from '@domain/shared/infra/logger.js';

import SqliteDb from '../sqlite/Database.js';
import SqliteKvDatabase from '../sqlite/KvDatabase.js';
import SqliteSearchEngine from '../sqlite/SearchEngine/index.js';
import { getRepositories } from '../sqlite/repository/index.js';

export default abstract class DesktopRuntime extends Runtime {
  constructor() {
    super();
    container.registerInstance(loggerToken, console);
    const db = new SqliteDb({ dir: this.getAppDir() });

    container.registerInstance(databaseToken, db);
    container.registerInstance(repositoriesToken, getRepositories(db));
    container.registerInstance(kvDatabaseToken, new SqliteKvDatabase(db));
    container.registerInstance(searchEngineToken, new SqliteSearchEngine(db));
    container.registerInstance(runtimeToken, this);
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

  public async ready() {
    const db = container.resolve(databaseToken);
    const kvDb = container.resolve(kvDatabaseToken);
    const searchEngine = container.resolve(searchEngineToken);

    await Promise.all([db.ready, kvDb.ready, searchEngine.ready]);
  }

  public getDeviceName() {
    return hostname();
  }
}
