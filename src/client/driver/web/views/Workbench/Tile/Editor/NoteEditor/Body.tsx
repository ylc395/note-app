import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';
import { useMemoizedFn } from 'ahooks';

import { Workbench } from '@domain/app/model/workbench';
import type NoteEditor from '@domain/app/model/note/Editor';
import MarkdownEditor from '@web/components/MarkdownEditor';

export default observer(function Body({ editor }: { editor: NoteEditor }) {
  const { editingEditor, setEditingEditor } = container.resolve(Workbench);
  const onFocus = useMemoizedFn(() => setEditingEditor(editor));

  return (
    <div className="relative min-h-0 grow px-4">
      {typeof editor.body === 'string' && (
        <MarkdownEditor
          autoFocus={editor.isFocused && !editor.uiState?.titleSelection}
          initialContent={editor.body}
          initialUIState={!editor.uiState || editor.uiState.titleSelection ? undefined : editor.uiState}
          content={editingEditor === editor ? undefined : editor.body}
          readonly={editor.isReadonly}
          onChange={editor.updateBody}
          onFocus={onFocus}
          onUIStateChange={editor.updateUIState}
        />
      )}
    </div>
  );
});
