import { observer } from 'mobx-react-lite';

import type NoteEditor from 'model/note/Editor';
import MarkdownEditor from 'web/components/common/MarkdownEditor';

export default observer(function NoteEditor({ editor }: { editor: NoteEditor }) {
  return (
    <div className="min-h-0 shrink grow overflow-auto px-4">
      <MarkdownEditor content={editor.entity?.body} onChange={editor.updateBody} />
    </div>
  );
});
