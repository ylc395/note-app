export class BusinessError extends Error {
  name = 'BusinessError';
}

export class InvalidInputError extends BusinessError {
  name = 'InvalidInputError';
}
