import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import once from 'lodash/once';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';

import { type KvDatabase, token as kvDatabaseToken } from 'infra/kvDatabase';

@Injectable()
export default class HttpGuard implements CanActivate {
  constructor(@Inject(kvDatabaseToken) private readonly kvDb: KvDatabase) {
    this.init();
  }

  private token?: string;
  private readonly init = once(async () => {
    this.token = await this.kvDb.get('app.http.token', randomUUID);
  });

  async canActivate(context: ExecutionContext) {
    if (!this.token) {
      throw new Error('not ready');
    }

    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === this.token;
  }
}
