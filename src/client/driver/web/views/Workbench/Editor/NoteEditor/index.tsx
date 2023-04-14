import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { useCreation } from 'ahooks';

import type NoteEditor from 'model/note/Editor';
import MarkdownEditor, { type EditorRef } from 'web/components/MarkdownEditor';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  const onChange = useCallback(
    (content: string) => {
      editor.updateBody(content, true);
    },
    [editor],
  );

  const [editorRef, setEditorRef] = useState<EditorRef | null>(null);

  const editorView = useCreation(() => {
    return <MarkdownEditor ref={setEditorRef} onChange={onChange} />;
  }, [onChange]);

  return (
    <div className="flex h-full flex-col">
      <Title editor={editor} editorRef={editorRef} />
      <Breadcrumb editor={editor} />
      <Body editorRef={editorRef} editor={editor}>
        {editorView}
      </Body>
    </div>
  );
});
