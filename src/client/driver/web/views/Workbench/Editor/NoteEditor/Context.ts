import { createContext } from 'react';

import type NoteEditorView from 'model/note/EditorView';
import type Editor from 'web/components/MarkdownEditor/Editor';
import type useModal from 'web/components/Modal/useModal';

export interface EditorContext {
  editorView: NoteEditorView;
  markdownEditor: Editor | null;
  infoModal: ReturnType<typeof useModal>;
  setMarkdownEditor: (v: Editor | null) => void;
}

export default createContext<EditorContext>(null as never);
