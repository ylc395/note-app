import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import type { IpcRequest } from 'client/driver/electron/ipc';

function createHttpDecorator(method: IpcRequest<unknown>['method']) {
  return function (path: string) {
    return function (cls: object, properKey: string, descriptor: PropertyDescriptor) {
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

export const Body = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.body;
});

export const Query = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.query || {};
});

export const Headers = createParamDecorator((filed, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.headers?.[filed];
});

export const Param = createParamDecorator((filed, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.params?.[filed];
});
