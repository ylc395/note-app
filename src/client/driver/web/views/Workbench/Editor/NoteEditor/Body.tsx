import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { useMemoizedFn } from 'ahooks';

import MarkdownEditor from 'web/components/MarkdownEditor';
import EditorContext from './Context';

export default observer(function NoteEditor() {
  const ctx = useContext(EditorContext);
  const { editorView } = ctx;
  const onChange = useMemoizedFn((content: string) => {
    if (editorView.tile.isFocused) {
      editorView.editor.updateBody(content);
    }
  });

  return (
    <div className="min-h-0 grow px-4">
      {typeof editorView.editor.entity?.body === 'string' && (
        <MarkdownEditor
          autoFocus
          initialContent={editorView.editor.entity.body}
          content={editorView.tile.isFocused ? undefined : editorView.editor.entity.body}
          readonly={editorView.editor.entity.metadata.isReadonly}
          onChange={onChange}
          onUIStateChange={editorView.updateUIState}
        />
      )}
    </div>
  );
});
