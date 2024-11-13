import { createContainer, Scope } from 'di-wise';

export const container = createContainer({
  defaultScope: Scope.Container,
  autoRegister: true,
});
