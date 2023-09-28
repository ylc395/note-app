import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { isMainThread, workerData } from 'node:worker_threads';
import { ModuleRef } from '@nestjs/core';
import { Inject } from '@nestjs/common';

import type { AppServerStatus } from 'model/app';
import { APP_NAME, IS_DEV, IS_TEST } from 'infra/constants';
import { token as databaseToken, type Database } from 'infra/database';

export const token = Symbol('runtime');
export const IS_IPC = workerData?.runtime !== 'http';

export default abstract class Runtime {
  private appInfo?: {
    clientId: string;
    appName: string;
    deviceName: string;
  };

  constructor(@Inject(ModuleRef) private readonly moduleRef: ModuleRef) {}

  isMain() {
    return isMainThread;
  }

  getDataDir() {
    const dir = IS_DEV ? `${APP_NAME}-dev` : IS_TEST ? `${APP_NAME}-test` : APP_NAME;

    if (process.env.APPDATA) {
      return join(process.env.APPDATA, dir);
    }

    return join(
      process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share',
      dir,
    );
  }

  protected get db() {
    return this.moduleRef.get<Database>(databaseToken, { strict: false });
  }

  async start() {
    this.appInfo = {
      clientId: await this.db.kv.get('app.desktop.id', randomUUID),
      appName: APP_NAME,
      deviceName: hostname(),
    };
  }

  getAppInfo() {
    if (!this.appInfo) {
      throw new Error('no client info');
    }

    return this.appInfo;
  }

  async getAppToken() {
    return await this.db.kv.get('app.http.token', randomUUID);
  }

  abstract toggleHttpServer(enable: boolean): Promise<AppServerStatus | null>;
}
