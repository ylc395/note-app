import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/editor/NoteEditor';

import Editor from './Editor';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(function NoteWorkbench({ editor }: { editor: NoteEditor }) {
  return (
    <div className="h-full flex flex-col">
      <Title editor={editor} />
      <Breadcrumb editor={editor} />
      <Editor editor={editor} />
    </div>
  );
});
