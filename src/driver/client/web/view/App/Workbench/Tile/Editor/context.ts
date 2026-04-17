import { createContextProvider } from '@solid-primitives/context';
import type BaseEditor from '#domain/client/app/model/Workbench/BaseEditor';

export const [ContextProvider, useContext] = createContextProvider((props: { editor: BaseEditor }) => ({
  editor: props.editor,
}));
