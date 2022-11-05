import type { PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

import { InvalidInputError } from 'model/Error';

export * from 'driver/electron/handler';

export function createPipe<T>(schema: ZodType<T>): PipeTransform {
  return {
    transform(value: unknown) {
      const result = schema.safeParse(value);

      if (!result.success) {
        throw InvalidInputError.fromZodError(result.error);
      }

      return value;
    },
  };
}
