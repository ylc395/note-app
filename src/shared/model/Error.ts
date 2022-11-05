import type { ZodError } from 'zod';
import get from 'lodash/get';
import set from 'lodash/set';
import isObject from 'lodash/isObject';

enum BusinessErrorTypes {
  InvalidInput,
}

export type Issues<T> = {
  [P in keyof T]?: T[P] extends object ? Issues<T[P]> : string;
};

export function getIssuesFromZodError({ issues }: ZodError) {
  const messages: Issues<unknown> = {};

  for (const { path, message } of issues) {
    set(messages, path, message);
  }

  return messages;
}

export class InvalidInputError extends Error {
  type = BusinessErrorTypes.InvalidInput;
  name = 'InvalidInputError';
  constructor(public readonly issues: Issues<unknown>) {
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
