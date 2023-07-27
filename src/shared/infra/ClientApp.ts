import { Emitter, type EventMap } from 'strict-event-emitter';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { ModuleRef } from '@nestjs/core';
import { Inject } from '@nestjs/common';

import { APP_NAME, IS_DEV, IS_TEST } from './constants';
import { token as kvDatabaseToken, type KvDatabase } from './kvDatabase';

export enum EventNames {
  BeforeStart = 'clientApp.created',
  Ready = 'clientApp.ready',
}

interface Events extends EventMap {
  [EventNames.BeforeStart]: [];
  [EventNames.Ready]: [];
}

export const token = Symbol('clientApp');

export default abstract class ClientApp extends Emitter<Events> {
  abstract type: string;
  private appInfo?: {
    clientId: string;
    appName: string;
    deviceName: string;
  };

  constructor(@Inject(ModuleRef) private readonly moduleRef: ModuleRef) {
    super();
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

  async start() {
    const kvDb = this.moduleRef.get<KvDatabase>(kvDatabaseToken, { strict: false });
    this.appInfo = {
      clientId: await kvDb.get('app.desktop.id', randomUUID),
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
}
