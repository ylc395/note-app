import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/note/Editor';

import Body from './Body';
import Title from './Title';
import Breadcrumb from './Breadcrumb';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  return (
    <div className="flex h-full flex-col">
      <Title editor={editor} />
      <Breadcrumb editor={editor} />
      <Body editor={editor} />
    </div>
  );
});
