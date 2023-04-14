import { createContext } from 'react';

import type NoteEditor from 'model/note/Editor';
import type { EditorRef } from 'web/components/MarkdownEditor';
import type { Modal } from 'web/infra/ui';

interface EditorContext {
  editor: NoteEditor;
  editorRef: EditorRef | null;
  infoModal: Modal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
