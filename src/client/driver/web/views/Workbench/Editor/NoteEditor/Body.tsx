import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import type NoteEditor from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/common/MarkdownEditor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const editorRef = useRef<EditorRef>(null);

  return (
    <div className="min-h-0 shrink grow overflow-auto px-4">
      <MarkdownEditor ref={editorRef} onChange={editor.updateBody} />
    </div>
  );
});
