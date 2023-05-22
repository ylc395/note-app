import { createContext } from 'react';

import type NoteEditor from 'model/note/Editor';
import type { EditorView } from 'web/components/MarkdownEditor';
import type { Modal } from 'web/infra/ui';

interface EditorContext {
  editor: NoteEditor;
  editorView: EditorView | null;
  infoModal: Modal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
