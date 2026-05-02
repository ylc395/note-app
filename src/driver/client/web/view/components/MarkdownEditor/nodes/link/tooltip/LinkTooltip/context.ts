import { createContextProvider } from '@solid-primitives/context';
import type { Ctx } from '@milkdown/kit/ctx';
import type useEntitySource from './useEntitySource';

export const [ContextProvider, useContext] = createContextProvider(
  (props: { entity: ReturnType<typeof useEntitySource>; milkdownCtx: Ctx }) => props,
);
