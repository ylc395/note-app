import type { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

import { InvalidInputError } from 'model/Error';
import { IS_IPC } from 'infra/DesktopRuntime';
import { IS_DEV } from 'infra/constants';
import * as ipcDecorators from 'driver/electron/decorators';
import * as httpDecorators from 'driver/localHttpServer/decorators';

export const Get = IS_IPC ? ipcDecorators.Get : httpDecorators.Get;
export const Post = IS_IPC ? ipcDecorators.Post : httpDecorators.Post;
export const Patch = IS_IPC ? ipcDecorators.Patch : httpDecorators.Patch;
export const Put = IS_IPC ? ipcDecorators.Put : httpDecorators.Put;
export const Delete = IS_IPC ? ipcDecorators.Delete : httpDecorators.Delete;
export const Body = IS_IPC ? ipcDecorators.Body : httpDecorators.Body;
export const Query = IS_IPC ? ipcDecorators.Query : httpDecorators.Query;
export const Param = IS_IPC ? ipcDecorators.Param : httpDecorators.Param;
export const Response = IS_IPC ? ipcDecorators.Response : httpDecorators.Response;
export const Request = IS_IPC ? ipcDecorators.Request : httpDecorators.Request;

export function createSchemaPipe<T>(schema: ZodType<T>): PipeTransform {
  return {
    transform(value: unknown) {
      if (IS_DEV || !IS_IPC) {
        const result = schema.safeParse(value);

        if (!result.success) {
          throw InvalidInputError.fromZodError(result.error);
        }

        return result.data;
      }

      return value;
    },
  };
}

export function EnableOnly(type: 'ipc' | 'http') {
  return (_: unknown, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    const origin = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: unknown[]) {
      if ((type === 'http' && IS_IPC) || (type === 'ipc' && !IS_IPC)) {
        throw new Error(`only enabled for ${type}`);
      }

      return origin.apply(this, args);
    };
  };
}
