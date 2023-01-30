import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/editor/NoteEditor';

import { EditorContext } from './context';
import Editor from './Editor';
import Title from './Title';

export default observer(function NoteWorkbench({ editor }: { editor: NoteEditor }) {
  return (
    <EditorContext.Provider value={editor}>
      <div>
        <Title />
        <Editor />
      </div>
    </EditorContext.Provider>
  );
});
