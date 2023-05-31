import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';

import { kvDbFactory } from 'driver/sqlite';

export default class HttpGuard implements CanActivate {
  private token?: string;
  private readonly kvDb = kvDbFactory();
  private readonly ready = this.init();
  private async init() {
    await this.kvDb.init();
    this.token = await this.kvDb.get('app.http.token', randomUUID);
  }

  async canActivate(context: ExecutionContext) {
    await this.ready;
    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === this.token;
  }
}
