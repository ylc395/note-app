import type { StructError } from 'superstruct';

export class BusinessError extends Error {
  name = 'BusinessError';
}

export type InvalidInputErrorCause = Record<string, string>;

interface InvalidInputErrorOptions {
  cause?: InvalidInputErrorCause;
}

export class InvalidInputError extends BusinessError {
  constructor(message?: string, options?: InvalidInputErrorOptions) {
    super(message, options);
  }
  name = 'InvalidInputError';
}

export function getErrors(err: StructError) {
  const failures = err.failures();
  const errors = failures.reduce((records, { key, refinement, type }) => {
    records[key] = `应当是一个 ${refinement} ${type}`;
    return records;
  }, {} as Record<string, string>);

  return errors;
}
