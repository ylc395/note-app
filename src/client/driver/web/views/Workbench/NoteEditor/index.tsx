import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/note/Editor';

import Milkdown from './Milkdown';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  return (
    <div className="h-full flex flex-col">
      <Title editor={editor} />
      <Breadcrumb editor={editor} />
      <Milkdown editor={editor} />
    </div>
  );
});
