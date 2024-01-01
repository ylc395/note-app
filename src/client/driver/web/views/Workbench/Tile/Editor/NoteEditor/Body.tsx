import { observer } from 'mobx-react-lite';
import { container } from 'tsyringe';

import { Workbench } from '@domain/app/model/workbench';
import type NoteEditor from '@domain/app/model/note/Editor';
import MarkdownEditor from '@web/components/MarkdownEditor';

export default observer(function Body({ editor }: { editor: NoteEditor }) {
  const { currentTile } = container.resolve(Workbench);

  return (
    <div className="relative min-h-0 grow px-4">
      {typeof editor.body === 'string' && (
        <MarkdownEditor
          // todo: autoFocus should be set correctly
          autoFocus
          initialContent={editor.body}
          initialUIState={!editor.uiState || editor.uiState.titleSelection ? undefined : editor.uiState}
          content={currentTile?.currentEditor === editor ? undefined : editor.body}
          readonly={editor.isReadonly}
          onChange={editor.updateBody}
          onUIStateChange={editor.updateUIState}
        />
      )}
    </div>
  );
});
