import { createContext } from 'react';

import type NoteEditor from 'model/editor/NoteEditor';

export const EditorContext = createContext<null | NoteEditor>(null);
