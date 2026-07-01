import { createContextProvider, type ContextProviderProps } from '@solid-primitives/context';
import type Memo from '#domain/client/app/model/memo/Memo';

interface Context extends ContextProviderProps {
  memo: Memo;
}

export const [ContextProvider, useContext] = createContextProvider((props: Context) => ({
  memo: props.memo,
}));
