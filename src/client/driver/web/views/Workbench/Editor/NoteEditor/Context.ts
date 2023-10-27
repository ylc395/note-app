import { createContext } from 'react';

import type NoteEditorView from 'model/note/EditorView';
import type useModal from 'web/components/Modal/useModal';

export interface EditorContext {
  editorView: NoteEditorView;
  infoModal: ReturnType<typeof useModal>;
}

export default createContext<EditorContext>(null as never);
