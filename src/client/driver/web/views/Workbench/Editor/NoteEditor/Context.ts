import { createContext } from 'react';

import type NoteEditor from 'model/note/Editor';
import type useModal from 'web/components/Modal/useModal';

export interface EditorContext {
  editor: NoteEditor;
  infoModal: ReturnType<typeof useModal>;
}

export default createContext<EditorContext>(null as never);
