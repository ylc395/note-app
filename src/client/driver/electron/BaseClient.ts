import { app as electronApp } from 'electron';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { hostname } from 'node:os';
import { Emitter } from 'strict-event-emitter';

import type { AppClient, ClientInfo, Events as AppClientEvents } from 'infra/appClient';
import { token as kvDatabaseToken, type KvDatabase } from 'infra/kvDatabase';

const APP_NAME = 'my-note-app';
const NODE_ENV = process.env.NODE_ENV;

@Injectable()
export default class BaseClient extends Emitter<AppClientEvents> implements AppClient {
  readonly headless = true;
  private clientInfo?: ClientInfo;

  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  readonly getDataDir = () => {
    return join(electronApp.getPath('appData'), `${APP_NAME}${NODE_ENV === 'development' ? '-dev' : ''}`);
  };

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
