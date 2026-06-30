import { createContextProvider } from '@solid-primitives/context';
import type MemoList from '#domain/client/app/model/memo/List';

export const [ContextProvider, useContext] = createContextProvider((props: { memoList: MemoList }) => ({
  memoList: props.memoList,
}));
