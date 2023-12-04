import { createContext } from 'react';

import type NoteEditor from '@domain/model/note/Editor';
import type useModal from '@components/Modal/useModal';

export interface EditorContext {
  editor: NoteEditor;
  infoModal: ReturnType<typeof useModal>;
}

export default createContext<EditorContext>(null as never);
