import { createContext } from 'react';

import type NoteEditor from '@domain/model/note/Editor';
import type { Modal } from '@components/Modal';

export interface EditorContext {
  editor: NoteEditor;
  infoModal: Modal;
}

export default createContext<EditorContext>(null as never);
