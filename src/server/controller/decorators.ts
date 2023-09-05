import type { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { isMainThread } from 'node:worker_threads';

import { InvalidInputError } from 'model/Error';
import * as ipcDecorators from 'driver/electron/decorators';
import * as httpDecorators from 'driver/localHttpServer/decorators';

export const Get = isMainThread ? ipcDecorators.Get : httpDecorators.Get;
export const Post = isMainThread ? ipcDecorators.Post : httpDecorators.Post;
export const Patch = isMainThread ? ipcDecorators.Patch : httpDecorators.Patch;
export const Put = isMainThread ? ipcDecorators.Put : httpDecorators.Put;
export const Delete = isMainThread ? ipcDecorators.Delete : httpDecorators.Delete;
export const Body = isMainThread ? ipcDecorators.Body : httpDecorators.Body;
export const Query = isMainThread ? ipcDecorators.Query : httpDecorators.Query;
export const Param = isMainThread ? ipcDecorators.Param : httpDecorators.Param;
export const Response = isMainThread ? ipcDecorators.Response : httpDecorators.Response;
export const Request = isMainThread ? ipcDecorators.Request : httpDecorators.Request;

export function createSchemaPipe<T>(schema: ZodType<T>): PipeTransform {
  return {
    transform(value: unknown) {
      const result = schema.safeParse(value);

      if (!result.success) {
        throw InvalidInputError.fromZodError(result.error);
      }

      return result.data;
    },
  };
}
