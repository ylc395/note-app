import { createContextProvider } from '@solid-primitives/context';
import type TreeExplorer from '#domain/client/app/model/note/TreeExplorer';

export const [ContextProvider, useContext] = createContextProvider((props: { treeExplorer: TreeExplorer }) => ({
  treeExplorer: props.treeExplorer,
}));
