import { Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback, useContext } from 'react';

import NoteEditor from 'model/editor/NoteEditor';

import { EditorContext } from './context';

export default observer(function NoteTitle() {
  const editor = useContext(EditorContext);
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => editor?.saveTitle(e.target.value), [editor]);

  return (
    <Input
      placeholder={editor?.note ? NoteEditor.normalizeTitle(editor.note) : ''}
      value={editor?.note?.title}
      onChange={handleChange}
    />
  );
});
