import type { ZodError } from 'zod';
import cloneDeepWith from 'lodash/cloneDeepWith';
import get from 'lodash/get';
import isObject from 'lodash/isObject';

enum BusinessErrorTypes {
  InvalidInput,
}

export interface Issues {
  [K: string]: string | Issues | undefined;
}

export function getIssuesFromZodError(zodError: ZodError) {
  return cloneDeepWith(zodError.format(), (value) => {
    if (value._errors && value._errors.length > 0) {
      return value._errors.join(';');
    }
  });
}

export class InvalidInputError extends Error {
  type = BusinessErrorTypes.InvalidInput;
  name = 'InvalidInputError';
  constructor(public readonly issues: Issues) {
    super('Invalid Input');
  }
  static fromZodError(zodError: ZodError) {
    return new InvalidInputError(getIssuesFromZodError(zodError));
  }

  static is(v: unknown): v is InvalidInputError {
    return (
      v instanceof InvalidInputError ||
      (get(v, 'type') === BusinessErrorTypes.InvalidInput && isObject(get(v, 'issues')))
    );
  }
}
