import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import once from 'lodash/once';
import type { Request } from 'express';
import { type KvDatabase, token as kvDatabaseToken } from 'infra/kvDatabase';
import { randomUUID } from 'node:crypto';

@Injectable()
export default class HttpGuard implements CanActivate {
  constructor(@Inject(kvDatabaseToken) private readonly kvDb: KvDatabase) {}
  private token?: string;
  private readonly init = once(async () => {
    this.token = await this.kvDb.get('app.http.token', randomUUID);
  });

  async canActivate(context: ExecutionContext) {
    if (!this.token) {
      await this.init();
    }

    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === this.token;
  }
}
