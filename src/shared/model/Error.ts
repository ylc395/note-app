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
