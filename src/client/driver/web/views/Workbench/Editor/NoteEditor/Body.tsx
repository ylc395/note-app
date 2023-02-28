import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { when } from 'mobx';

import type NoteEditor from 'model/note/Editor';
import { Events } from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/common/MarkdownEditor';
import type { Listener } from 'eventemitter2';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const editorRef = useRef<EditorRef>(null);

  useEffect(() => {
    const listener = editor.on(
      Events.BodySynced,
      (body: string) => {
        editorRef.current?.updateContent(body);
      },
      { objectify: true },
    ) as Listener;

    const stopInit = when(
      () => Boolean(editor.entity),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      () => editorRef.current!.updateContent(editor.entity!.body),
    );

    return () => {
      listener.off();
      stopInit();
    };
  }, [editor]);

  return (
    <div className="min-h-0 shrink grow overflow-auto px-4">
      <MarkdownEditor ref={editorRef} onChange={editor.updateBody} />
    </div>
  );
});
