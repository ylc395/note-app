import { createContext } from 'react';

import type NoteEditorView from 'model/note/EditorView';
import type { EditorView } from 'web/components/MarkdownEditor';
import type { Modal } from 'web/infra/ui';

interface EditorContext {
  editorView: NoteEditorView;
  markdownEditorView: EditorView | null;
  infoModal: Modal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default createContext<EditorContext>(null as any);
