import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import type { IpcRequest } from 'infra/transport';

type Method = IpcRequest<unknown>['method'];

function createHttpDecorator(method: Method) {
  return function (path: string): MethodDecorator {
    // attach message to ipc request for IpcServer
    return function (cls, properKey, descriptor) {
      const messagePattern = MessagePattern({ path: path.startsWith('/') ? path : `/${path}`, method });
      messagePattern(cls, properKey, descriptor);
    };
  };
}

export const Get = createHttpDecorator('GET');
export const Post = createHttpDecorator('POST');
export const Delete = createHttpDecorator('DELETE');
export const Patch = createHttpDecorator('PATCH');
export const Put = createHttpDecorator('PUT');

export const Body = createParamDecorator(async (field, ctx: ExecutionContext) => {
  return typeof field === 'string'
    ? ctx.getArgByIndex<IpcRequest<Record<string, unknown>>>(0)?.body?.[field]
    : ctx.getArgByIndex<IpcRequest<unknown>>(0)?.body;
});

export const Query = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.query || {};
});

export const Param = createParamDecorator((field, ctx: ExecutionContext) => {
  const param = ctx.getArgByIndex<IpcRequest<unknown>>(0)?.params?.[field];
  return param ? decodeURIComponent(param) : undefined;
});

export const Response = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.switchToRpc().getContext();
});

export const Request = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.switchToRpc().getData();
});
