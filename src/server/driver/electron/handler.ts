import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import type { IpcRequest } from 'client/driver/electron/ipc';

function createDecorator(method: IpcRequest<unknown>['method']) {
  return function (path: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (cls: any, properKey: string, descriptor: PropertyDescriptor) {
      const messagePattern = MessagePattern({ path: path.startsWith('/') ? path : `/${path}`, method });
      messagePattern(cls, properKey, descriptor);
    };
  };
}

export const Get = createDecorator('GET');
export const Post = createDecorator('POST');
export const Delete = createDecorator('DELETE');
export const Patch = createDecorator('PATCH');
export const Put = createDecorator('PUT');

export const Body = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.body;
});

export const Query = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.getArgByIndex<IpcRequest<unknown>>(0)?.query;
});
