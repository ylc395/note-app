import { Emitter, type EventMap } from 'strict-event-emitter';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { ModuleRef } from '@nestjs/core';
import { Inject } from '@nestjs/common';

import { APP_NAME, NODE_ENV } from './constants';
import { token as kvDatabaseToken, type KvDatabase } from './kvDatabase';

export enum EventNames {
  BeforeStart = 'appClient.created',
  Ready = 'appClient.ready',
}

interface Events extends EventMap {
  [EventNames.BeforeStart]: [];
  [EventNames.Ready]: [];
}

export const token = Symbol('appClient');

export default abstract class AppClient extends Emitter<Events> {
  abstract type: string;
  private clientInfo?: {
    clientId: string;
    appName: string;
    deviceName: string;
  };

  constructor(@Inject(ModuleRef) private readonly moduleRef: ModuleRef) {
    super();
  }

  getDataDir() {
    const dir = NODE_ENV === 'development' ? `${APP_NAME}-dev` : APP_NAME;

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
    this.clientInfo = {
      clientId: await kvDb.get('app.desktop.id', randomUUID),
      appName: APP_NAME,
      deviceName: hostname(),
    };
  }

  getClientInfo() {
    if (!this.clientInfo) {
      throw new Error('no client info');
    }

    return this.clientInfo;
  }
}
