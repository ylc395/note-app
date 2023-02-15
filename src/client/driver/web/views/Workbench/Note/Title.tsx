import { Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { type ChangeEvent, useCallback } from 'react';

import { normalizeTitle } from 'interface/Note';
import type NoteEditor from 'model/editor/NoteEditor';

export default observer(function NoteTitle({ editor }: { editor: NoteEditor }) {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => editor?.saveTitle(e.target.value), [editor]);

  return (
    <Input
      className="font-semibold text-lg border-none"
      placeholder={editor.note ? normalizeTitle(editor.note) : ''}
      value={editor.note?.title}
      onChange={handleChange}
    />
  );
});
