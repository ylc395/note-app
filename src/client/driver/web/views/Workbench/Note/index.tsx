import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/editor/NoteEditor';

import Editor from './Editor';
import Title from './Title';

export default observer(function NoteWorkbench({ editor }: { editor: NoteEditor }) {
  return (
    <div className="bg-white h-full">
      <Title editor={editor} />
      <Editor editor={editor} />
    </div>
  );
});
