import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import { useMemoizedFn } from 'ahooks';
import { container } from 'tsyringe';

import { Workbench } from '@domain/app/model/workbench';
import type NoteEditor from '@domain/app/model/note/Editor';
import MarkdownEditor, { type EditorRef } from '@web/components/MarkdownEditor';

export default observer(function Body({ editor }: { editor: NoteEditor }) {
  const { currentTile } = container.resolve(Workbench);
  const editorRef = useRef<EditorRef | null>(null);
  const isFocus = currentTile === editor.tile; // todo: only focus when uiState is on body
  const onFocus = useMemoizedFn(() => editor.tile.switchToEditor(editor));

  useEffect(() => {
    if (isFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isFocus]);

  return (
    <div className="relative min-h-0 grow px-4">
      {typeof editor.body === 'string' && (
        <MarkdownEditor
          ref={editorRef}
          autoFocus={isFocus}
          initialContent={editor.body}
          initialUIState={!editor.uiState || editor.uiState.titleSelection ? undefined : editor.uiState}
          content={isFocus ? undefined : editor.body}
          readonly={editor.isReadonly}
          onChange={editor.updateBody}
          onFocus={onFocus}
          onUIStateChange={editor.updateUIState}
        />
      )}
    </div>
  );
});
