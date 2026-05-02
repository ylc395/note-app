import { createContextProvider } from '@solid-primitives/context';
import type { Ctx } from '@milkdown/kit/ctx';
import type useEntity from './useEntity';

export const [ContextProvider, useContext] = createContextProvider(
  (props: { entity: ReturnType<typeof useEntity>; milkdownCtx: Ctx }) => props,
);
