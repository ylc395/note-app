import type { PipeTransform } from '@nestjs/common';
import type { Describe } from 'superstruct';

import { InvalidInputError } from 'model/Error';

export * from 'driver/electron/handler';

export function createPipe<T>(struct: Describe<T>) {
  return class ValidatorPipe implements PipeTransform {
    transform(value: unknown) {
      const [err] = struct.validate(value);

      if (err) {
        throw new InvalidInputError(`invalid input ${err.message.toLowerCase()}`);
      }

      return value;
    }
  };
}
