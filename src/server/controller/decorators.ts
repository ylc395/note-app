import type { PipeTransform } from '@nestjs/common';
import type { Struct } from 'superstruct';

import { InvalidInputError, getErrors } from 'model/Error';

export * from 'driver/electron/handler';

export function createPipe<T>(struct: Struct<T>) {
  return class ValidatorPipe implements PipeTransform {
    transform(value: unknown) {
      const [err] = struct.validate(value);

      if (err) {
        const cause = getErrors(err);
        throw new InvalidInputError(`invalid input ${err.message.toLowerCase()}`, { cause });
      }

      return value;
    }
  };
}
