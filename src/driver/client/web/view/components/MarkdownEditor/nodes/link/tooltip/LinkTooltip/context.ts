import { createContextProvider } from '@solid-primitives/context';
import type { Ctx } from '@milkdown/kit/ctx';
import type makeEntity from './makeEntity';

export const [ContextProvider, useContext] = createContextProvider(
  (props: { entity: ReturnType<typeof makeEntity>; milkdownCtx: Ctx }) => props,
);
