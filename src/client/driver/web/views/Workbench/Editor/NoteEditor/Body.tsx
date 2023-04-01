import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { when } from 'mobx';

import type NoteEditor from 'model/note/Editor';
import { type BodyEvent, Events } from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const editorRef = useRef<EditorRef>(null);

  useEffect(() => {
    const onBodySynced = (body: BodyEvent) => {
      editorRef.current?.updateContent(body, false);
    };
    const stopInit = when(
      () => Boolean(editor.entity),
      () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        editorRef.current!.updateContent(editor.entity!.body);
        editor.on(Events.BodySynced, onBodySynced);
      },
    );

    return () => {
      editor.off(Events.BodySynced, onBodySynced);
      stopInit();
    };
  }, [editor]);

  return (
    <div className="min-h-0 grow px-4">
      <MarkdownEditor ref={editorRef} onChange={editor.updateBody} />
    </div>
  );
});
