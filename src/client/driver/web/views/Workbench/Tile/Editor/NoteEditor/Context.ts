import { createContext } from 'react';

import type NoteEditor from '@domain/app/model/note/Editor';

export interface EditorContext {
  editor: NoteEditor;
}

export default createContext<EditorContext>(null as never);
