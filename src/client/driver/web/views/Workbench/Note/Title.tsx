import { Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { EditorContext } from './context';

export default observer(function NoteTitle() {
  const editor = useContext(EditorContext);

  return <Input value={editor?.note?.title} onChange={(e) => editor?.saveTitle(e.target.value)} />;
});
