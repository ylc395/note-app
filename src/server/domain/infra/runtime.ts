import type { InjectionToken } from 'tsyringe';
import type { AppServerStatus } from '@domain/model/app.js';

import type { KvDatabase } from './kvDatabase.js';
import type { Database } from './database.js';
import type { SearchEngine } from './searchEngine.js';

export const token: InjectionToken<Runtime> = Symbol('runtime');

export abstract class Runtime {
  protected abstract readonly kv: KvDatabase;
  protected abstract readonly db: Database;
  protected abstract readonly searchEngine: SearchEngine;
  public abstract bootstrap(): Promise<void>;
  public abstract getAppDir(): string;
  public abstract getDeviceName(): string;
  public abstract toggleHttpServer?(enable: boolean): Promise<AppServerStatus | null>;
  public async whenReady() {
    await Promise.all([this.db.ready, this.kv.ready, this.searchEngine.ready]);
  }
}
