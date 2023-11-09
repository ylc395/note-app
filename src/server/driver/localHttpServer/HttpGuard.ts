import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import type { Request } from 'express';

import { token as runtimeToken } from 'infra/DesktopRuntime';
import type DesktopRuntime from 'infra/DesktopRuntime';

@Injectable()
export default class HttpGuard implements CanActivate {
  constructor(@Inject(runtimeToken) private readonly runtime: DesktopRuntime) {}

  private token?: string;

  async canActivate(context: ExecutionContext) {
    if (!this.token) {
      this.token = await this.runtime.getAppToken();
    }

    const request = context.switchToHttp().getRequest<Request>();
    return request.headers.authorization === this.token;
  }
}
