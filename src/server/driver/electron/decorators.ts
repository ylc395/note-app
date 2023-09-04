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
import rawbody from 'raw-body';

import type { FakeHttpRequest } from 'infra/fakeHttp';

type Method = FakeHttpRequest<unknown>['method'];

const REAL_HTTP: Record<Method, (path: string) => MethodDecorator> = {
  GET: HttpGet,
  POST: HttpPost,
  PUT: HttpPut,
  DELETE: HttpDelete,
  PATCH: HttpPatch,
};

function createHttpDecorator(method: Method) {
  return function (path: string) {
    // attach message to ipc request for IpcServer
    const fakeHttpDecorator: MethodDecorator = function (cls, properKey, descriptor) {
      const messagePattern = MessagePattern({ path: path.startsWith('/') ? path : `/${path}`, method });
      messagePattern(cls, properKey, descriptor);
    };

    // listen to both fakeHTTP(ipc) and real HTTP
    return applyDecorators(fakeHttpDecorator, REAL_HTTP[method](path));
  };
}

export const Get = createHttpDecorator('GET');
export const Post = createHttpDecorator('POST');
export const Delete = createHttpDecorator('DELETE');
export const Patch = createHttpDecorator('PATCH');
export const Put = createHttpDecorator('PUT');

// todo: don't know how to reuse decorators below from @nestjs/common package. So just DIY some simple impl for both fakeHTTP and real HTTP

export const Body = createParamDecorator(async (field, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (request.headers['content-type']?.startsWith('text/')) {
      const raw = (await rawbody(request)).toString();
      return raw;
    }

    return typeof field === 'string' ? request.body?.[field] : request.body;
  }

  return typeof field === 'string'
    ? ctx.getArgByIndex<FakeHttpRequest<Record<string, unknown>>>(0)?.body?.[field]
    : ctx.getArgByIndex<FakeHttpRequest<unknown>>(0)?.body;
});

export const Query = createParamDecorator((_, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().query;
  }

  return ctx.getArgByIndex<FakeHttpRequest<unknown>>(0)?.query || {};
});

export const Headers = createParamDecorator((filed, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().headers[filed];
  }

  return ctx.getArgByIndex<FakeHttpRequest<unknown>>(0)?.headers?.[filed];
});

export const Param = createParamDecorator((field, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<Request>().params[field];
  }

  const param = ctx.getArgByIndex<FakeHttpRequest<unknown>>(0)?.params?.[field];
  return param ? decodeURIComponent(param) : undefined;
});

export const Response = createParamDecorator((_, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getResponse();
  }

  return ctx.switchToRpc().getContext();
});

export interface IResponse {
  set: (k: string, v: string) => void;
}
