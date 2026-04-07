import { createContextProvider } from '@solid-primitives/context';
import type PDFEditorViewer from './PDFEditorViewer';

export const [ContextProvider, useContext] = createContextProvider((props: { viewer: PDFEditorViewer }) => ({
  viewer: props.viewer,
}));
