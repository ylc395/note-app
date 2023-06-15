import { createContext } from 'react';

import type NoteEditorView from 'model/note/EditorView';
import type { EditorView } from 'web/components/MarkdownEditor';
import type useModal from 'web/components/Modal/useModal';

export interface EditorContext {
  editorView: NoteEditorView;
  markdownEditorView: EditorView | null;
  infoModal: ReturnType<typeof useModal>;
  setMarkdownEditorView: (v: EditorView | null) => void;
}

export default createContext<EditorContext>(null as never);
