import { createContextProvider } from '@solid-primitives/context';
import type Memo from '#domain/client/app/model/memo/Memo';

export const [ContextProvider, useContext] = createContextProvider((props: { memo: Memo }) => ({
  memo: props.memo,
}));
