import type { PipeTransform } from '@nestjs/common';
import type { Describe } from 'superstruct';

import { InvalidInputError } from 'model/Error';

export * from 'driver/electron/handler';

export function createPipe<T>(struct: Describe<T>) {
  return class ValidatorPipe implements PipeTransform {
    transform(value: unknown) {
      const [err] = struct.validate(value);

      if (err) {
        const failures = err.failures();
        const cause = failures.reduce((records, { key, refinement, type }) => {
          records[key] = `应当是一个 ${refinement} ${type}`;
          return records;
        }, {} as Record<string, string>);

        throw new InvalidInputError(`invalid input ${err.message.toLowerCase()}`, { cause });
      }

      return value;
    }
  };
}
