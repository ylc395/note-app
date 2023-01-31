import { Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import NoteEditor from 'model/editor/NoteEditor';

import { EditorContext } from './context';

export default observer(function NoteTitle() {
  const editor = useContext(EditorContext);

  return (
    <Input
      placeholder={editor?.note ? NoteEditor.normalizeTitle(editor.note) : ''}
      value={editor?.note?.title}
      onChange={(e) => editor?.saveTitle(e.target.value)}
    />
  );
});
