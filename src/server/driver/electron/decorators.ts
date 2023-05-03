import {
  createParamDecorator,
  type ExecutionContext,
  applyDecorators,
  Get as HttpGet,
  Post as HttpPost,
  Delete as HttpDelete,
  Patch as HttpPatch,
  Put as HttpPut,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { Request } from 'express';

import type { IpcRequest } from 'client/driver/electron/ipc';

function createHttpDecorator(method: IpcRequest<unknown>['method']) {
  return function (path: string) {
    const fakeHttpDecorator: MethodDecorator = function (cls, properKey, descriptor) {
      const messagePattern = MessagePattern({ path: path.startsWith('/') ? path : `/${path}`, method });
      messagePattern(cls, properKey, descriptor);
    };

    const map: Record<typeof method, (path: string) => MethodDecorator> = {
      GET: HttpGet,
      POST: HttpPost,
      PUT: HttpPut,
      DELETE: HttpDelete,
      PATCH: HttpPatch,
    };

    return applyDecorators(fakeHttpDecorator, map[method](path));
  };
}

export const Get = createHttpDecorator('GET');
export const Post = createHttpDecorator('POST');
export const Delete = createHttpDecorator('DELETE');
export const Patch = createHttpDecorator('PATCH');
export const Put = createHttpDecorator('PUT');

// todo: don't know how to reuse decorators below from @nestjs/common package. So just DIY some simple impl

export const Body = createParamDecorator((field, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    const request = ctx.switchToHttp().getRequest<Request>();
    return typeof field === 'string' ? request.body?.[field] : request.body;
  }

  return typeof field === 'string'
    ? ctx.getArgByIndex<IpcRequest<Record<string, unknown>>>(0)?.body?.[field]
    : ctx.getArgByIndex<IpcRequest<unknown>>(0)?.body;
});

export const Query = createParamDecorator((_, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().query;
  }

  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.query || {};
});

export const Headers = createParamDecorator((filed, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().headers[filed];
  }

  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.headers?.[filed];
});

export const Param = createParamDecorator((field, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().params[field];
  }

  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.params?.[field];
});
