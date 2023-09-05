import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import type { Request } from 'express';

import { token as appToken } from 'infra/ClientApp';
import type ClientApp from 'infra/ClientApp';

@Injectable()
export default class HttpGuard implements CanActivate {
  constructor(@Inject(appToken) private readonly app: ClientApp) {}

  private token?: string;

  async canActivate(context: ExecutionContext) {
    if (!this.token) {
      this.token = await this.app.getAppToken();
    }

    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === this.token;
  }
}
